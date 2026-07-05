# LobeHub + NocoBase 集成技术可行性报告

## 一、核心问题回答

### Q: LobeHub 和 NocoBase 都支持 API 快速对接吗？

**答案：是的，两者都有完善的 API 能力。**

#### LobeHub API 能力

| 能力 | 支持情况 | 说明 |
|------|---------|------|
| REST API | ✅ 基础有 | 有 v1 API，但主要是 tRPC |
| tRPC API | ✅ 核心 | 类型安全的 RPC 接口 |
| OIDC/OAuth | ✅ 支持 | Better Auth 支持 Generic OIDC |
| SSO | ✅ 支持 | Google、Github、微信、企业微信、飞书等 |
| Webhook | ✅ 支持 | 部分功能有 webhook |
| API Key | ✅ 支持 | 用户级 API Key |

**LobeHub 的 Generic OIDC Provider**：
```typescript
// 环境变量配置
AUTH_GENERIC_OIDC_ID=xxx
AUTH_GENERIC_OIDC_ISSUER=https://your-idp.com
AUTH_GENERIC_OIDC_SECRET=xxx
```
这意味着 LobeHub **可以对接任何 OIDC 兼容的身份提供者**，包括 NocoBase。

#### NocoBase API 能力

| 能力 | 支持情况 | 说明 |
|------|---------|------|
| REST API | ✅ 完整 | 通过数据表自动生成 CRUD API |
| OIDC Provider | ✅ 支持 | `@nocobase/plugin-idp-oauth` |
| OAuth 2.0 | ✅ 支持 | 内置 OAuth 2.0 支持 |
| SAML | ✅ 支持 | 通过插件 |
| CAS | ✅ 支持 | 通过插件 |
| LDAP | ✅ 支持 | 通过插件 |
| SSO | ✅ 支持 | 完整的企业 SSO 能力 |
| GraphQL | ✅ 支持 | 通过插件 |
| Webhook | ✅ 支持 | 完整的事件触发 |
| SDK | ✅ 支持 | TypeScript SDK |

---

## 二、关键发现：NocoBase 可作为 OIDC 身份提供者

### `@nocobase/plugin-idp-oauth` 插件

这是**本集成方案的核心**：

> **OIDC / OAuth provider scaffold for NocoBase.**
> - Use `oidc-provider` as the protocol engine
> - Let NocoBase own user session, storage, and admin configuration
> - Expose a provider instance that resource-server plugins can integrate with

**这意味着**：
- NocoBase **可以作为 OIDC 身份提供者（IdP）**
- 其他应用（如 LobeHub）可以通过 OIDC 与 NocoBase 对接
- NocoBase 管理用户、角色、权限、SSO
- LobeHub 通过 OIDC 验证用户身份

---

## 三、用户数据接管分析

### 问题：用户数据是否可以完全由 NocoBase 接管？

**答案：可以，但需要分场景处理。**

### 场景一：NocoBase 作为 IdP（推荐）

**架构图**：

```
┌─────────────────┐     OIDC/OAuth      ┌─────────────────┐
│   NocoBase      │ ◄─────────────────► │   LobeHub        │
│   (IdP)         │                     │   (SP)          │
│                 │                     │                  │
│  ✓ 用户管理     │                     │  ✓ AI Chat       │
│  ✓ 角色权限     │                     │  ✓ Agent         │
│  ✓ 组织架构     │                     │  ✓ 工作区        │
│  ✓ 订阅套餐     │                     │  ✓ 会话/消息     │
│  ✓ SSO          │                     │                  │
└─────────────────┘                     └─────────────────┘
        │
        │ 共享同一个
        │ 用户数据库
        ▼
┌─────────────────┐
│  PostgreSQL     │
│  (用户表)       │
└─────────────────┘
```

**实现方式**：

1. **NocoBase 配置为 OIDC Provider**
   - 启用 `@nocobase/plugin-idp-oauth`
   - 配置 client ID/Secret
   - 配置 scopes（openid, profile, email, roles）

2. **LobeHub 配置为 OIDC Client**
   ```env
   # LobeHub 环境变量
   AUTH_GENERIC_OIDC_ID=lobehub-client
   AUTH_GENERIC_OIDC_ISSUER=https://nocobase.example.com
   AUTH_GENERIC_OIDC_SECRET=xxx
   ```

3. **用户数据同步**
   - **方案 A**：NocoBase 和 LobeHub 共享同一个 PostgreSQL 数据库
     - 优点：数据实时同步，无需额外同步机制
     - 缺点：数据库耦合
   - **方案 B**：NocoBase 创建用户时，通过 webhook 同步到 LobeHub
     - 优点：数据库解耦
     - 缺点：需要维护同步逻辑

**推荐：方案 A（共享数据库）**

### 场景二：NocoBase 直连 LobeHub 数据库

**架构图**：

```
┌─────────────────┐     直连数据库     ┌─────────────────┐
│   NocoBase      │ ◄──────────────►  │   LobeHub        │
│   (管理后台)    │                   │   (核心系统)     │
│                 │                   │                  │
│  ✓ 用户管理     │   users 表        │  ✓ AI Chat       │
│  ✓ 角色权限     │   workspaces 表   │  ✓ Agent         │
│  ✓ 组织架构     │   rbac_* 表       │  ✓ 工作区        │
│  ✓ 订阅套餐     │                   │  ✓ 会话/消息     │
└─────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  PostgreSQL     │
                                     │  (单一数据库)    │
                                     └─────────────────┘
```

**优点**：
- 实现简单，快速上线
- NocoBase 可视化管理用户、角色、订阅
- 数据完全一致

**缺点**：
- NocoBase 直接操作 LobeHub 核心数据
- 需要注意权限控制，避免误操作

---

## 四、功能接管能力分析

### 1. 用户管理

| 功能 | NocoBase 能力 | LobeHub 支持 | 接管可行性 |
|------|-------------|-------------|-----------|
| 用户 CRUD | ✅ 完整 | ✅ 完整 | ✅ 完全可接管 |
| 用户分组/部门 | ✅ plugin-departments | ❌ 无 | ✅ NocoBase 主导 |
| 组织架构 | ✅ 支持 | ❌ 无 | ✅ NocoBase 主导 |
| 用户角色 | ✅ ACL 系统 | ✅ RBAC | ✅ 可同步 |
| SSO (OIDC/SAML) | ✅ 完整 | ✅ Generic OIDC | ✅ NocoBase 作为 IdP |

### 2. 订阅与套餐

| 功能 | NocoBase 能力 | LobeHub 支持 | 接管可行性 |
|------|-------------|-------------|-----------|
| 套餐管理 | ⚠️ 需插件 | ❌ 无 | ✅ NocoBase 插件化 |
| 订单管理 | ⚠️ 需插件 | ❌ 无 | ✅ NocoBase 插件化 |
| 积分系统 | ⚠️ 需插件 | ❌ 无 | ✅ NocoBase 插件化 |
| 支付接入 | ⚠️ 需插件 | ❌ 无 | ✅ NocoBase 插件化（微信支付） |

**推荐**：在 NocoBase 中创建以下数据表：
- `plans` - 套餐表
- `orders` - 订单表
- `payments` - 支付记录表
- `credits` - 积分表
- `credit_transactions` - 积分流水表

### 3. 角色权限

| 功能 | NocoBase 能力 | LobeHub 支持 | 接管可行性 |
|------|-------------|-------------|-----------|
| 系统角色 | ✅ 完整 | ✅ super_admin | ⚠️ 需映射 |
| 工作区角色 | ⚠️ 需扩展 | ✅ workspace_owner/member/viewer | ⚠️ 需同步 |
| 细粒度权限 | ✅ ACL | ✅ RBAC | ⚠️ 需映射 |

**建议**：
- LobeHub 保留 `super_admin` 角色
- 其他角色在 NocoBase 中管理
- 通过共享的 `rbac_user_roles` 表保持同步

### 4. 邀请功能

| 功能 | NocoBase 能力 | LobeHub 支持 | 接管可行性 |
|------|-------------|-------------|-----------|
| 邀请链接 | ⚠️ 需插件 | ✅ workspace_invitations | ✅ 可复用 |
| 邮件邀请 | ✅ 插件支持 | ✅ 有 | ✅ 可复用 |
| 邀请审批 | ⚠️ 需插件 | ❌ 无 | ✅ NocoBase 主导 |

---

## 五、技术实现方案

### 方案二详细实现（推荐）

#### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        NocoBase                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 用户管理    │  │ 订阅管理    │  │ 支付管理            │  │
│  │ (AC)        │  │ (插件)      │  │ (插件)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  数据库 A    │                          │
│                    │  (NocoBase) │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API / Webhook   │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                         LobeHub                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AI Chat     │  │ Agent       │  │ 工作区              │  │
│  │ (保留)      │  │ (保留)      │  │ (保留)              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  数据库 B    │                          │
│                    │  (LobeHub)  │                          │
│                    │  共享 users  │                          │
│                    │  表          │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

#### 实现步骤

**Phase 1: 数据库共享（1 周）**

1. 修改 LobeHub 数据库配置，指向共享的 PostgreSQL
2. 确保 `users` 表结构兼容 NocoBase
3. 测试基本 CRUD 操作

**Phase 2: NocoBase 用户管理（1 周）**

1. NocoBase 连接共享数据库
2. 创建用户管理界面
3. 配置 ACL 权限
4. 测试用户 CRUD

**Phase 3: 订阅系统插件（2 周）**

1. 创建订阅相关数据表
2. 开发套餐管理插件
3. 开发订单管理插件
4. 开发积分管理插件

**Phase 4: 支付集成（2 周）**

1. 开发微信支付插件
2. 实现支付回调处理
3. 实现订单状态同步

**Phase 5: LobeHub 集成（1 周）**

1. 开发 LobeHub 管理 API
2. 订阅校验中间件
3. 前端订阅页面 iframe 集成

---

## 六、风险与注意事项

### 1. 数据一致性风险

**问题**：NocoBase 和 LobeHub 同时操作用户数据可能导致冲突。

**解决方案**：
- 共享同一数据库事务
- 使用数据库锁机制
- 关键操作通过 API 进行

### 2. 认证流程冲突

**问题**：LobeHub 有自己的认证流程，与 NocoBase 可能冲突。

**解决方案**：
- 方案 A：禁用 LobeHub 本地认证，强制使用 NocoBase SSO
- 方案 B：保持 LobeHub 认证入口，但用户数据由 NocoBase 管理

### 3. 版本升级兼容

**问题**：LobeHub 升级可能导致表结构变化。

**解决方案**：
- 使用数据库迁移工具（Drizzle）
- 重要变更前做好备份
- 保持 NocoBase 和 LobeHub 的版本兼容

### 4. 性能影响

**问题**：NocoBase 管理后台可能影响 LobeHub 性能。

**解决方案**：
- NocoBase 使用独立的数据库连接池
- 敏感操作在低峰期进行
- 做好监控和告警

---

## 七、最佳实践建议

### 1. 数据库设计

```sql
-- 共享用户表（LobeHub 核心）
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password_hash TEXT,  -- NocoBase 管理的密码
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NocoBase 扩展表
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    department TEXT,
    position TEXT,
    employee_id TEXT,
    metadata JSONB DEFAULT '{}'
);

-- 订阅相关表（NocoBase 管理）
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    plan_id INTEGER REFERENCES plans(id),
    status TEXT DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. NocoBase 插件开发

```typescript
// packages/plugins/@nocobase/plugin-lobehub-users/src/server/index.ts
import { ISchema } from '@nocobase/client';

const lobehubUsersSchema: ISchema = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      'x-component': 'Table',
      properties: {
        id: { type: 'string', 'x-component': 'Table.Column' },
        email: { type: 'string', 'x-component': 'Table.Column' },
        role: {
          type: 'string',
          'x-component': 'Select',
          'x-component-props': {
            options: [
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' },
              { label: 'Super Admin', value: 'super_admin' },
            ],
          },
        },
      },
    },
  },
};

export default class PluginLobeHubUsers extends Plugin {
  async load() {
    this.app.addResource({
      name: 'users',
      actions: {
        list: async (ctx) => {
          // 连接 LobeHub 数据库获取用户
        },
        create: async (ctx) => {
          // 创建用户并同步到 LobeHub
        },
      },
    });
  }
}
```

### 3. LobeHub 认证中间件

```typescript
// packages/trpc/src/middleware/nocobaseAuth.ts
import { TRPCError } from '@trpc/server';
import { trpc } from '../init';

export const nocobaseAuth = trpc.middleware(async (opts) => {
  const { ctx, next } = opts;

  // 从 NocoBase SSO 获取用户
  if (ctx.nocobaseToken) {
    const user = await validateNocoBaseToken(ctx.nocobaseToken);
    return next({
      ctx: {
        ...ctx,
        userId: user.id,
        userRole: user.role,
        isNocoBaseManaged: true,
      },
    });
  }

  // 回退到 LobeHub 本地认证
  return next();
});
```

---

## 八、结论

### ✅ 技术可行性：**完全可行**

| 方面 | 评估 |
|------|------|
| API 对接 | ✅ 两者都有完善的 API |
| 用户管理 | ✅ 可由 NocoBase 完全接管 |
| 角色权限 | ✅ 可通过 RBAC 同步 |
| 订阅套餐 | ✅ 可通过 NocoBase 插件实现 |
| 支付接入 | ✅ 可通过 NocoBase 插件实现 |
| 前端集成 | ✅ 支持 iframe 嵌入 |

### 推荐方案

**采用方案二：NocoBase 独立数据库 + LobeHub API**

1. **用户系统**：NocoBase 管理，共享 `users` 表
2. **订阅系统**：NocoBase 插件实现
3. **支付系统**：NocoBase 插件 + 微信支付
4. **LobeHub**：保留 AI 核心功能，通过 API 与 NocoBase 通信

### 开发周期预估

| 阶段 | 工作内容 | 周期 |
|------|---------|------|
| Phase 1 | 数据库共享配置 | 1 周 |
| Phase 2 | NocoBase 用户管理 | 1 周 |
| Phase 3 | 订阅系统插件 | 2 周 |
| Phase 4 | 支付集成 | 2 周 |
| Phase 5 | LobeHub API 集成 | 1 周 |
| **总计** | | **7 周** |

### 下一步行动

1. ✅ 技术可行性确认：**通过**
2. ⬜ 方案选型确认（建议方案二）
3. ⬜ 详细技术设计
4. ⬜ 开发实施

---

## 附录：相关文档

- [LobeHub + NocoBase 集成方案](./spec.md)
- [开发任务列表](./tasks.md)
- [验收检查清单](./checklist.md)
- [订阅与计费系统调研](../docs/research/subscription-billing.md)
- [RBAC 权限系统](../docs/research/rbac-permissions.md)
