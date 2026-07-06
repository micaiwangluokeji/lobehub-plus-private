# LobeHub 商业化体系全面调研报告

> **日期**: 2026-07-05  
> **分支**: feature/commercial-saas-v1  
> **调研范围**: 会员等级 × 套餐订阅 × RBAC 权限 × 数据隔离 × Feature Flags

---

## 一、会员等级 vs 套餐订阅：是否冲突？

### 1.1 当前现状

项目中存在 **三套独立、互不连接的体系**：

```
┌─────────────────────────────────────────────────────────────┐
│                     三套独立用户分层体系                        │
├───────────────┬──────────────────┬───────────────────────────┤
│ RBAC 角色     │ 订阅计划          │ 会员等级                   │
│ (roles 表)    │ (subscriptions +  │ (membership_levels 表)    │
│               │  plans 表)        │                           │
├───────────────┼──────────────────┼───────────────────────────┤
│ super_admin   │ Free (stub 返回)  │ name / slug / level       │
│ vip_user      │ Hobby             │ minRechargeTotal (门槛)   │
│ free_user     │ Premium           │ monthlyCreditsBonus       │
│               │ Starter           │ storageBonusMB            │
│               │ Ultimate          │ features (权益 JSON)      │
├───────────────┼──────────────────┼───────────────────────────┤
│ ✅ 已实现运行  │ ❌ getSubscription │ ❌ 仅管理端 CRUD           │
│   (权限检查)   │   Plan() 是 stub  │   无自动升级/权益执行      │
├───────────────┼──────────────────┼───────────────────────────┤
│ 权限门控      │ 定价/预算          │ 累充门槛/月赠积分          │
│ 角色分配      │ 计费周期           │ 存储奖励/等级标识          │
└───────────────┴──────────────────┴───────────────────────────┘
```

### 1.2 三者之间的关系

| 关系 | 代码证据 |
|------|---------|
| subscriptions ↔ plans | `subscriptions.planId` → `plans.id`（外键），OK |
| subscriptions ↔ RBAC 角色 | **无连接**。`getSubscriptionPlan()` 硬编码返回 `Plans.Free` |
| membership_levels ↔ RBAC 角色 | **无连接**。`vip_user` 角色从未被 `assignSystemRoleToUser` 分配 |
| membership_levels ↔ subscriptions | **无连接**，无共享外键，无业务逻辑 |
| membership_levels ↔ users | `users.membershipLevelId`（裸 text 字段，无 FK 约束） |
| 任何 ↔ 充值/支付 | `topUpRouter` 仅创建订单记录，**无自动升级/角色分配逻辑** |

### 1.3 关键 Stub 函数

```typescript
// packages/business-server/src/user.ts:16-18
export async function getSubscriptionPlan(userId: string): Promise<Plans> {
  return Plans.Free;  // ← 始终返回 Free，从未查数据库
}

// packages/business-server/src/user.ts:20-23
export async function initNewUserForBusiness(
  userId: string, createdAt: Date | null | undefined,
): Promise<void> {}  // ← 空函数
```

### 1.4 结论

**不冲突，因为三者从未连接。** 它们是三个完全独立的配置系统，各自有管理界面，但：
- RBAC 角色真正运行（权限检查活跃）
- 订阅计划/套餐定价仅 admin CRUD，无运行时执行
- 会员等级仅 admin CRUD，完全未使用
- 积分/预算字段（personalBudget/workspaceBudget）定义了但从未被运行时检查
- 积分消费记录（credit_transactions）有表但创建 `type:'consumption'` 的代码不存在

---

## 二、是否可以删除 VIP 用户，用全新会员等级替代？

### 2.1 VIP 用户（vip_user）的真相

**`vip_user` 是一个 RBAC 系统角色，拥有明确权限，但从未被分配给任何用户。**

```
seedSystemRoles（种子化）: 创建了 vip_user 角色 + 定义了它的权限
assignSystemRoleToUser: 从未以 'vip_user' 为参数被调用
```

新用户注册时只分配 `free_user`：
```typescript
// apps/server/src/services/user/index.ts:28-67
async initUser(user: CreatedUser) {
  await assignSystemRoleToUser(this.db, {
    roleName: SYSTEM_DEFAULT_ROLES.FREE_USER,  // 始终只分配 free_user
    userId: user.id,
  });
}
```

### 2.2 建议：用会员等级驱动 RBAC 角色

可行方案：

```
充值成功 → 计算累计充值总额
        → 查 membership_levels 表：找到满足 minRechargeTotal 的最高等级
        → 更新 users.membershipLevelId
        → 如果等级 ≥ 付费最低门槛：分配 vip_user RBAC 角色
        → 如果等级 = 最高等级：分配 super_admin 相关权限（或新增 premium_user 角色）
```

### 2.3 建议的角色体系

| RBAC 角色 | 对应 membership | 来源 |
|-----------|---------------|------|
| `free_user`（保留） | 默认（level=0，无门槛） | 新用户注册自动分配 |
| `vip_user`（保留） | 付费会员（level≥1） | 充值触达门槛后自动分配 |
| `super_admin`（保留） | 管理员 | 手动分配（与会员等级无关） |

> Free/Pro 两个等级是最简洁的设计。但如果需要更细粒度权益（如月赠积分、存储空间不同），可以用 membership_levels 表的 `monthlyCreditsBonus`/`storageBonusMB`/`features` 字段实现渐进式权益，而不必创建更多 RBAC 角色。

---

## 三、Free User 权限全景

### 3.1 RBAC 权限定义

```typescript
// packages/const/src/rbac.ts:575-581
[SYSTEM_DEFAULT_ROLES.FREE_USER]: [
  `${action('AGENT_READ')}:owner`,      // 只能读自己安装的 agent
  `${action('AGENT_UPDATE')}:owner`,    // 只能改自己安装的 agent
  `${action('AGENT_DELETE')}:owner`,    // 只能删自己安装的 agent
],
```

**Free user 只有 3 个权限码，全部 `:owner` 作用域。**

### 3.2 Free User 能做什么 vs 不能做什么

| 操作 | Free User | VIP User | Super Admin |
|------|-----------|----------|-------------|
| 浏览 Discover 页面 | ✅ 可见（feature flag 控制） | ✅ | ✅ |
| 使用/安装 Discover 上的 agent | ✅（agent:read:owner） | ✅ | ✅ |
| 修改已安装的 agent | ✅（agent:update:owner） | ✅ | ✅ |
| 删除已安装的 agent | ✅（agent:delete:owner） | ✅ | ✅ |
| **创建新的 agent** | ❌ 无 agent:create | ✅ agent:create:all | ✅ |
| **Fork agent** | ❌ 无 agent:fork | ✅ agent:fork:all | ✅ |
| **发布 agent 到 Discover** | ❌ 无 agent:publish | ✅ agent:publish:owner（待审核） | ✅ agent:update:all（直接发布） |
| **创建/发布 group** | ❌ 无 group:publish | ✅ group:publish:owner | ✅ |
| 创建 Session/Message | ❌ 无 session:create | ✅ session:create:owner | ✅ |
| 上传文件 | ❌ 无 file:upload | ✅ file:upload:owner | ✅ |
| 创建文档 | ❌ 无 document:create | ✅ document:create:owner | ✅ |
| 创建知识库 | ❌ 无 knowledge_base:create | ✅ knowledge_base:create:owner | ✅ |
| 调用 AI 模型 | ❌ 无 ai_model:invoke | ✅ ai_model:invoke:all | ✅ |
| 管理 API Key | ❌ 无 api_key:* | ✅ api_key:*:owner | ✅ |
| 读取其他用户信息 | ❌ 无 user:read | ✅ user:read:all | ✅ |

> **关键发现：Free user 当前权限极其受限，甚至不能创建 Session/Message（即不能聊天），不能调用 AI 模型，不能上传文件。**

### 3.3 前端权限检查

```typescript
// src/hooks/usePermission.ts:27-42
const ACTION_PERMISSION_MAP: Record<string, string[]> = {
  create_content: ['agent:create:all', 'agent:create:owner'],  // free_user 无
  edit_own_content: ['agent:update:all', 'agent:update:owner'], // free_user 有
  manage_settings: [],                    // 所有人允许
  manage_provider_key: [],                // 所有人允许
  manage_official_agents: ['agent:update:all'],  // 仅 super_admin
  publish_agent: ['agent:update:all', 'agent:publish:owner'],  // admin 直接/VIP 审核
  publish_group: ['group:publish:all', 'group:publish:owner'],  // 同上
};
```

### 3.4 Agent 发布流程

| 角色 | 发布行为 |
|------|---------|
| Super Admin | 直接 `publishAsOfficial()`，agent 立即在 Discover 页面可见 |
| VIP User | `submitForReview()` → 进入 `pending_review` 状态 → 等待 super_admin 批准 |
| Free User | 无发布入口（无 `agent:publish` 权限），界面不显示发布按钮 |

---

## 四、数据隔离全面分析

### 4.1 核心隔离机制

所有核心数据表通过 `userId` + `workspaceId` 双重字段实现隔离。底层工具函数：

```typescript
// packages/database/src/utils/workspace.ts
buildWorkspaceWhere({ userId, workspaceId }, table)
// 个人模式 (workspaceId = NULL):  WHERE userId = ? AND workspace_id IS NULL
// 工作空间模式 (workspaceId != NULL):  WHERE workspace_id = ?
```

### 4.2 逐模块隔离清单

| 模块 | 表/存储 | userId | workspaceId | 隔离结论 |
|------|---------|--------|-------------|---------|
| **Agent** | agents | ✅ | ✅ | ✅ 用户隔离。published 的 agent (Discover) 全局可见但所有权归发布者 |
| **Chat Group** | chat_groups | ✅ | ✅ | ✅ 用户隔离 |
| **Session** | sessions | ✅ | ✅ | ✅ 用户隔离 |
| **Message** | messages | ✅ | ✅ | ✅ 用户隔离 |
| **File** | files | ✅ | ✅ | ✅ 用户隔离。支持 category=all/image 等过滤 |
| **Document** | files (documents) | ✅ | ✅ | ✅ 用户隔离 |
| **Knowledge Base** | files (knowledge_bases) | ✅ | ✅ | ✅ 用户隔离。有 `isPublic` 标志（预留公开分享） |
| **Task** | tasks | ✅ | ✅ | ✅ 用户隔离（by createdByUserId）。支持 assignee 多用户协作 |
| **Memory** | user_memories | ✅ | ❌ | ✅ 用户隔离（仅 userId，无 workspaceId） |
| **User Settings** | user_settings | ✅ (PK=users.id) | ❌ | ✅ 用户隔离（一对一绑定 users.id） |
| **Device** | devices | ✅ | ✅ | ✅ 用户隔离。支持 workspace 设备共享 |
| **API Key** | api_keys | ✅ | ❌ | ✅ 用户隔离 |
| **Provider Config** | (in user_settings.keyVaults) | ✅ | ❌ | ✅ 用户隔离（存储在 user_settings JSONB 中） |
| **Subscription** | subscriptions | ✅ | ✅ | ✅ 用户隔离 |
| **Credit Transaction** | credit_transactions | ✅ | ✅ | ✅ 用户隔离 |
| **Notification** | notifications | ✅ | ❌ | ✅ 用户隔离 |
| **Translation** | translations | ✅ | ✅ | ✅ 用户隔离 |

### 4.3 Agent 共享 vs 隔离详解

| Agent 状态 | 可见范围 | 所有权 |
|-----------|---------|--------|
| private | 仅创建者 | 创建者 |
| link (分享链接) | 拥有链接的人 | 创建者 |
| official (发布到 Discover) | **所有已登录用户** | 发布者（admin） |
| pending_review | 创建者 + admin | 创建者 |

> Free user 通过 Discover 页面 "安装" agent 后，在自己的 agents 表中创建一条记录（userId=自己），拥有 `owner` 权限可以读/改/删。这与其他用户的数据完全隔离。

---

## 五、页面功能逐一调研

### 5.1 `/resource` vs `/page`

| 维度 | `/resource` | `/page` |
|------|------------|---------|
| **功能** | 文件资源管理器 | 文档/Page 浏览器 |
| **操作** | CRUD（上传/删除/分块/知识库关联） | 只读浏览 |
| **数据源** | files 表 | 通过 identifier 解析的 docs |
| **URL** | `/resource`, `/resource/library/[slug]` | `/page`, `/page/[id]` |
| **隔离** | ✅ userId 隔离 | ✅ userId 隔离 |

### 5.2 设置页面隔离情况

| 设置页面 | 存储位置 | 隔离 |
|---------|---------|------|
| `/settings/stats` | 用户统计数据（token 消耗等） | ✅ 用户隔离 |
| `/settings/appearance` | `user_settings.general` JSONB | ✅ 用户隔离 |
| `/settings/devices` | `devices` 表 (by userId) | ✅ 用户隔离 |
| `/settings/provider/all` | `user_settings.keyVaults` (API keys) + provider 表 | ⚠️ API key 用户隔离；provider 配置可全局共享 |
| `/settings/service-model` | `user_settings.languageModel` JSONB + `user_settings.image` JSONB | ✅ 用户隔离 |
| `/settings/skill` | `user_settings.tool` JSONB | ✅ 用户隔离 |
| `/settings/memory` | `user_settings.memory` JSONB | ✅ 用户隔离 |
| `/settings/messenger` | 用户级聊天平台配置 | ✅ 用户隔离 |
| `/settings/storage` | 用户文件存储统计 | ✅ 用户隔离 |
| `/settings/advanced` | 用户级高级设置 | ✅ 用户隔离 |

**结论：所有设置页面都是用户隔离的。** `user_settings` 表以 `users.id` 为主键且是一对一关系，每个用户的设置完全独立。

### 5.3 `/memory` vs `/settings/memory`

| 维度 | `/memory` | `/settings/memory` |
|------|-----------|-------------------|
| **是什么** | **用户记忆数据浏览页面** | **记忆功能设置** |
| **功能** | 查看 Persona（人格画像）、活动记忆、上下文记忆、经验记忆、身份记忆、偏好记忆 | 启用/禁用记忆功能 + 提取力度（low/medium/high） |
| **子页面** | `/memory/activities`, `/memory/contexts`, `/memory/experiences`, `/memory/identities`, `/memory/preferences` | 无子页面 |
| **数据** | `user_memories` 表（userMemory router） | `user_settings.memory` JSONB 字段 |
| **隔离** | ✅ 所有查询过滤 `eq(userMemories.userId, ctx.userId)` | ✅ 按 userId 读写 |

---

## 六、Free User 功能限制总结

### 6.1 AI 服务商/模型限制

| 功能 | Free User | VIP User |
|------|-----------|----------|
| 设置 AI 服务商 (provider) | ❌ 无 `ai_provider:create` | ✅ `ai_provider:create:owner` |
| 读取 AI 服务商 | ❌ 无 `ai_provider:read` | ✅ `ai_provider:read:all` |
| 设置服务模型 | ❌ 无 `ai_model:create` | ✅ `ai_model:create:owner` |
| 使用模型 (invoke) | ❌ 无 `ai_model:invoke` | ✅ `ai_model:invoke:all` |
| 读取模型列表 | ❌ 无 `ai_model:read` | ✅ `ai_model:read:all` |

> **Free user 完全不能与 AI 模型交互**——既不能配置自己的服务商，也不能调用模型。只能使用系统默认配置（由 super_admin 设置）。

### 6.2 Skills/工具

Free user 无 `session:create` 权限，因此无法使用任何 skill 或工具（工具在会话中运行）。VIP user 可以使用 `user_settings.tool` 中配置的工具。

### 6.3 Image 功能

Free user 无 `session:create`、`ai_model:invoke`，因此**无法使用图片生成**。Image 设置（`defaultImageNum`）存储在 `user_settings.image` JSONB 中，用户隔离。

Feature flag `showAiImage` 默认 `true`，但 Free user 受 RBAC 权限限制无法实际调用。

### 6.4 导航栏可见性

Feature flags 控制每个角色能看到哪些导航项（默认全部可见）：

| 导航项 | Free User 开关 | VIP User 开关 | 默认值 |
|--------|---------------|-------------|--------|
| Home | `nav_home_for_free_user` | `nav_home_for_vip_user` | true |
| Discover | `nav_discover_for_free_user` | `nav_discover_for_vip_user` | true |
| Tasks | `nav_tasks_for_free_user` | `nav_tasks_for_vip_user` | true |
| Pages | `nav_pages_for_free_user` | `nav_pages_for_vip_user` | true |
| Image | `nav_image_for_free_user` | `nav_image_for_vip_user` | true |
| Resource | `nav_resource_for_free_user` | `nav_resource_for_vip_user` | true |
| Memory | `nav_memory_for_free_user` | `nav_memory_for_vip_user` | true |

> 导航栏可见 ≠ 功能可用。Free user 可以看到入口，但实际操作时受 RBAC 权限拦截（后端中间件 + 前端 `usePermission` 双重防护）。

---

## 七、商业化改造建议

### 7.1 立即需要做的

1. **打通充值 → 会员等级 → RBAC 角色链路**
   - 在 `topUp` 充值回调中：计算累计充值总额 → 匹配 membership_level → 更新 `users.membershipLevelId` → 分配 `vip_user` 角色
   - 需要新建一个 `MembershipService` 统一处理升级/降级逻辑

2. **放宽 Free User 权限**
   - 当前 free_user 太受限（甚至不能聊天），建议补充：
     - `session:create:owner`, `message:create:owner`（基础聊天）
     - `ai_model:invoke:all`（使用系统默认模型）
     - `file:upload:owner`（上传文件）
     - `ai_provider:read:all`（查看可用服务商）
     - `ai_model:read:all`（查看可用模型）
   - 或者更简单：创建一个 `pro_user` 作为付费用户角色，`free_user` 为基础免费用户

3. **激活订阅计划运行时逻辑**
   - 实现 `getSubscriptionPlan()`：真正查 subscriptions 表
   - 实现 budget 检查：在 AI 调用前检查 `personalBudget`/`workspaceBudget`
   - 实现积分消费记录：在 spend_logs 中写入每次 AI 调用的消耗

4. **会员权益执行**
   - 每月定时任务：按 `membership_levels.monthlyCreditsBonus` 赠送积分
   - 存储限额检查：按 `membership_levels.storageBonusMB` 叠加
   - features 权益清单：在 UI 中动态展示

### 7.2 完整的用户分层建议

| 层级 | RBAC 角色 | 获取方式 | 核心能力 |
|------|----------|---------|---------|
| Free | `free_user` | 注册即得 | 浏览 Discover、使用已安装 agent、基础聊天、使用系统默认模型 |
| Pro | `pro_user`（新建） | 订阅/充值 | 创建 agent/group、发布到 Discover（待审核）、自定义 provider、管理 API Key、更多配额 |
| Admin | `super_admin` | 手动分配 | 全部权限 |

### 7.3 改造后的用户旅程

```
新用户注册 → 自动分配 free_user 角色
         → 可使用：Discover agent + 基础聊天 + 默认模型
         ↓
    充值/订阅 → 自动升级 membershipLevel（如"黄金会员"）
         → 自动分配 pro_user（或 vip_user）RBAC 角色
         → 解锁：创建 agent、发布审核、自定义 provider/model、更多存储/积分
         ↓
    管理员手动分配 → super_admin 角色
         → 全部权限（包括审核 VIP 发布的 agent、访问 Admin 面板）
```

---

## 八、数据源索引

| 文件 | 关键内容 |
|------|---------|
| `packages/const/src/rbac.ts` | RBAC 权限动作定义、系统角色定义、SYSTEM_ROLE_PERMISSIONS |
| `packages/business-server/src/trpc-middlewares/rbacPermission.ts` | RBAC 权限中间件 |
| `apps/server/src/services/user/index.ts` | 新用户注册时分配 free_user 角色 |
| `packages/business-server/src/user.ts` | getSubscriptionPlan（stub）、initNewUserForBusiness（空函数） |
| `packages/database/src/utils/seedSystemRoles.ts` | 系统角色种子化（创建 super_admin/vip_user/free_user） |
| `packages/app-config/src/featureFlags/schema.ts` | 全部 feature flags 定义 |
| `src/hooks/usePermission.ts` | 前端语义化权限 Hook |
| `src/hooks/useUserRoles.ts` | 用户角色检测（isSuperAdmin/isVip/isFreeUser） |
| `packages/database/src/schemas/user.ts` | users 表 + user_settings 表（用户级设置 JSONB） |
| `packages/database/src/schemas/membershipLevels.ts` | membership_levels 表 |
| `packages/database/src/schemas/paymentPlans.ts` | payment_configs + plans + credit_configs 表 |
| `packages/database/src/schemas/subscriptions.ts` | subscriptions 表 |
| `packages/database/src/schemas/creditTransactions.ts` | credit_transactions 表 |
| `packages/business-server/src/lambda-routers/membershipLevel.ts` | 会员等级 admin CRUD |
| `packages/business-server/src/lambda-routers/subscription.ts` | 订阅 admin CRUD |
| `packages/business-server/src/lambda-routers/plan.ts` | 套餐 plan admin CRUD |
| `packages/business-server/src/lambda-routers/topUp.ts` | 充值订单创建/查询 |
