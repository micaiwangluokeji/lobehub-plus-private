# LobeHub RBAC 权限系统：根因分析与永久解决方案

> 日期：2026-07-05  
> 状态：方案设计  
> 关联：商业化 v2 / PR #N

---

## 一、问题根因分析

### 1.1 现象
- `niudada` (isRoot=true, super_admin 角色) 在浏览器看到"创建助理"按钮置灰
- 数据库里 super_admin 角色有 120 个权限码
- `usePermission('create_content')` 返回 `{ allowed: false }`
- 每次新增功能都要手动补 super_admin 权限，**必然遗漏**

### 1.2 根因：`isRoot` 短路 + SWR 缓存错位

**RBAC 权限设计**：
```
isRoot 短路：直接绕过所有权限检查（设计意图：超管不需走 RBAC）
getUserPermissions：返回用户的权限码列表（SWR 缓存）
前端 usePermission：根据 SWR 返回的权限码做 UI 门控
```

**Bug**：
```typescript
// packages/database/src/models/rbac.ts
getUserPermissions = async (arg) => {
  if (await this.isRootUser()) return [];  // ← BUG：isRoot 返回空
  // ... 查 4 表 JOIN
}
```

**结果**：
| 角色 | 数据库权限 | API 返回 | 前端判断 | 实际效果 |
|------|-----------|---------|---------|---------|
| super_admin (isRoot=true) | 120 | `[]` | 0 权限 | **按钮全灰** |
| free_user | 30 | 30 | 30 | 正常 |
| pro_user | 48 | 48 | 48 | 正常 |

**前端 usePermission**：
```typescript
return useMemo(() => {
  const codes = ACTION_PERMISSION_MAP[action];  // ['agent:create:all', 'agent:create:owner']
  const hasPermission = (code) => permissions.includes(code);
  // 加载中或无权限列表 → optimistic allow
  // 否则 → codes.some(code => permissions.includes(code))
});
```

逻辑本身没问题，**是后端数据错了**。

### 1.3 第二个问题：手动 seed 容易遗漏

每次新增功能（如 billing、credit、referral），代码里新增了权限码，但**没重新 seed**：
- `seedSystemRoles` 只在 admin 升级/系统初始化时跑
- 已有的角色（super_admin/free_user 等）权限不会自动更新
- 必须重新跑 seed 或 SQL 手动补

---

## 二、LifeOS 的做法（参考）

LifeOS 用 NestJS 装饰器**自动收集**权限：

```typescript
@Controller('users')
@ConsoleController('users', '用户管理')
export class UsersController {
  @Get()
  @Permissions('users:list')  // ← 装饰器声明
  list() {}

  @Post()
  @Permissions('users:create')
  create() {}
}
```

**启动时自动扫描**：
```typescript
// ConsoleAccessService 启动时
@PostConstruct()
async scanAllPermissions() {
  // 扫描所有 controller
  // 收集所有 @Permissions 装饰器
  // 同步到 rbac_permissions 表
  // 给 super_admin 自动分配所有权限
}
```

**优势**：
1. 新增 controller → 新增权限自动注册
2. 装饰器即文档，权限一目了然
3. super_admin 自动获得所有权限（无需手动维护）
4. 废弃的 controller → 权限自动清理

---

## 三、永久解决方案

### 3.1 方案 A：修复 isRoot 短路（必须）

**当前 bug**：`if (await this.isRootUser()) return [];`

**修复**：
```typescript
// RbacModel.getUserPermissions
getUserPermissions = async (arg) => {
  if (await this.isRootUser()) {
    // isRoot 用户返回所有 :all 权限码（让前端 UI 解锁）
    const allPermissions = await this.db
      .select({ code: permissions.code })
      .from(permissions)
      .where(eq(permissions.isActive, true));
    return allPermissions.map(p => p.code);
  }
  // ... 原 4 表 JOIN 逻辑
};
```

**同时修复 RbacModel.hasPermission**：
```typescript
hasPermission = async (codes, opts) => {
  if (await this.isRootUser()) return true;  // 已正确
  // ...
};
```

### 3.2 方案 B：自动权限同步脚本（强烈建议）

**新建** `scripts/sync-system-permissions.ts`：

```typescript
// 1. 从 const/rbac.ts 读取所有 PERMISSION_ACTIONS
// 2. 展开为完整权限码（含 :all 和 :owner scope）
// 3. 同步到 rbac_permissions 表（INSERT 新的、UPDATE description）
// 4. 给 super_admin 自动分配所有权限
// 5. 分配到 free_user/pro_user（按 SYSTEM_ROLE_PERMISSIONS）
```

**接入 npm scripts**：
```json
{
  "scripts": {
    "rbac:sync": "tsx scripts/sync-system-permissions.ts",
    "rbac:sync:audit": "tsx scripts/sync-system-permissions.ts --audit"  // 只检查不写
  }
}
```

**加入 pre-commit hook**：
```bash
# .githooks/pre-commit
bun run rbac:sync:audit  # 新增权限未注册时阻止提交
```

### 3.3 方案 C：装饰器式权限声明（彻底解决）

新建 `packages/const/src/permissions.ts`：

```typescript
// 集中式权限码定义（已存在）
export const PERMISSION_ACTIONS = { ... };

// 新增：装饰器风格的权限要求
export const RequirePermission = (action: keyof typeof PERMISSION_ACTIONS, scope: 'all' | 'owner' = 'owner') => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('permission', `${PERMISSION_ACTIONS[action]}:${scope}`, descriptor.value);
  };
};
```

**使用**：
```typescript
class AgentService {
  @RequirePermission('AGENT_CREATE', 'all')
  async createAgent() {}
}
```

**启动时扫描**（类似 LifeOS）：
```typescript
// scripts/scan-permissions.ts
@PostConstruct()
async scan() {
  const metadata = Reflect.getMetadata('permission', method);
  // INSERT/UPDATE rbac_permissions
}
```

### 3.4 方案 D：统一 RBAC 检查 helper（避免重复）

新建 `packages/business-server/src/trpc-middlewares/requirePermission.ts`：

```typescript
import { withAnyRbacPermission } from './rbacPermission';

export const requireAgentCreate = withAnyRbacPermission(['agent:create:all', 'agent:create:owner']);
export const requireAgentRead = withAnyRbacPermission(['agent:read:all', 'agent:read:owner']);
export const requireAdminAccess = withAnyRbacPermission(['billing:manage:all', 'rbac:role_read:all']);
```

**使用**：
```typescript
createAgent: requireAgentCreate.input(...).mutation(...)
```

---

## 四、推荐实施步骤

### 第一阶段：紧急修复（30 分钟）

1. **修复 `RbacModel.getUserPermissions` 的 isRoot 短路** → 返回所有 :all 权限
2. **运行 SQL 校验**：对所有 super_admin 角色用户，确保 isRoot=true

### 第二阶段：自动化脚本（2-3 小时）

3. **实现 `scripts/sync-system-permissions.ts`**
4. **添加到 `bun run rbac:sync` 命令**
5. **运行一次，把当前所有权限码同步到数据库**

### 第三阶段：长期治理（可选，1-2 天）

6. **新建 `RequirePermission` 装饰器**
7. **改造关键 service 使用装饰器**
8. **新增 `npm run rbac:audit` + pre-commit hook**
9. **CI 检查：新增 `const/rbac.ts` 权限时必须同步 DB**

---

## 五、立即可执行的具体步骤

### 步骤 1：修复 isRoot 短路 bug

**文件**：`packages/database/src/models/rbac.ts`

```typescript
// 改前
if (await this.isRootUser()) return [];

// 改后
if (await this.isRootUser()) {
  // isRoot 用户直接返回所有 active 权限码，让前端 UI 解锁
  const allPerms = await this.db
    .select({ code: permissions.code })
    .from(permissions)
    .where(eq(permissions.isActive, true));
  return allPerms.map(p => p.code);
}
```

### 步骤 2：实现 sync-system-permissions 脚本

**文件**：`scripts/sync-system-permissions.ts`

```typescript
import { PERMISSION_ACTIONS, SYSTEM_ROLE_PERMISSIONS, SYSTEM_DEFAULT_ROLES, RBAC_PERMISSIONS } from '@lobechat/const/rbac';

async function sync() {
  const db = createClient({ databaseUrl: process.env.DATABASE_URL });

  // 1. 计算完整的权限码列表（含 :all + :owner）
  const allCodes = new Set<string>();
  for (const code of Object.values(RBAC_PERMISSIONS)) {
    allCodes.add(code);
  }

  console.log(`Found ${allCodes.size} permission codes in const/rbac.ts`);

  // 2. 同步到 rbac_permissions 表
  for (const code of allCodes) {
    await db.insert(permissions)
      .values({ code, isActive: true, name: code })
      .onConflictDoUpdate({
        target: permissions.code,
        set: { isActive: true },
      });
  }
  console.log(`Synced ${allCodes.size} permissions to DB`);

  // 3. 给 super_admin 分配所有
  for (const code of allCodes) {
    await db.insert(rolePermissions)
      .values({ roleId: superAdminRoleId, permissionId: ... })
      .onConflictDoNothing();
  }

  // 4. 按 SYSTEM_ROLE_PERMISSIONS 分配其他角色
  // ...
}
```

### 步骤 3：rbac:audit 集成 pre-commit

**.lintstagedrc** 或 **.githooks/pre-commit**：

```bash
# 新增权限时检查数据库
bun run rbac:sync:audit
```

如果 const/rbac.ts 有新权限但 DB 缺失 → 阻止提交。

---

## 六、相关文件清单

| 文件 | 改动 |
|------|------|
| `packages/database/src/models/rbac.ts` | 修复 isRoot 短路 |
| `scripts/sync-system-permissions.ts` | 新增同步脚本 |
| `package.json` | 添加 rbac:sync 命令 |
| `.githooks/pre-commit` | 添加 rbac:audit |
| `docs/research/rbac-permission-system-design.md` | 本文档 |

---

## 七、临时绕过方案

如果短期需要立即看到效果，**SQL 手动给 niudada 直接赋予所有权限**：

```sql
-- 通过 rbac_role_permissions 给他（不实际分配角色，但让他拥有所有权限）
INSERT INTO rbac_user_permissions (user_id, permission_id)
SELECT 'user_pz9pZzuiZ8yTV3fqa6RVRZ9jnt5', p.id
FROM rbac_permissions p
ON CONFLICT DO NOTHING;
```

但这是**绕过 RBAC 设计的临时方案**，正确做法是修复 isRoot 短路。
