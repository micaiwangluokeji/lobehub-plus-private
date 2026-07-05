# LobeHub 中国 C 端商业化 PRD v2.0

> **版本**：v2.0  
> **状态**：草稿  
> **项目**：LobeHub Canary  
> **分支**：feature/commercial-saas-v1  
> **参考模型**：LifeOS/BuildingAI 商业化体系

---

## 一、商业模式总览

### 1.1 核心理念

**积分（Credits）作为平台统一虚拟货币，驱动全部商业行为。**

```
        充值/订阅/邀请/注册赠送
                │
                ▼
         ┌─────────────┐
         │   积分余额    │ ← 实时余额 = SUM(credit_transactions.amount)
         └──────┬──────┘
                │
                ▼
         AI 调用消费（聊天/图片/视频/文档）
         spend_logs + credit_transactions
```

### 1.2 用户分层

| 层级 | RBAC 角色 | 获取方式 | 积分 | 核心权限 |
|------|----------|---------|------|---------|
| **Free** | `free_user` | 注册即得 | 新手赠送 N 积分 + 邀请奖励 | 基础聊天、使用 Discover agent、上传文件 |
| **Pro** | `pro_user` | 订阅套餐 / 累计充值达标 | 每月定额积分 + 额外购买 | 创建 agent/group、自定义 provider/model、发布到 Discover（审核） |
| **Admin** | `super_admin` | 手动分配 | 不限制 | 全部权限、管理后台 |

### 1.3 积分生命周期

```
获取积分                     消耗积分                     积分记录
────────                    ────────                    ────────
注册赠送 (bonus)     →       AI 聊天 (consumption)   →   credit_transactions
邀请奖励 (bonus)     →       AI 图片 (consumption)   →   (type/amount/
充值购买 (top_up)    →       AI 视频 (consumption)   →    balanceAfter/
订阅月赠 (bonus)     →       文档解析 (consumption)  →    source/referenceId)
管理员调整 (adjustment) →    
退款退回 (refund)    →
```

---

## 二、权限交互体系（前后端完整逻辑）

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│                                                              │
│  useUserRoles()         usePermission()       FeatureFlags   │
│  ├── isFreeUser         ├── create_content    ├── nav_home    │
│  ├── isPro              ├── publish_agent     ├── nav_image   │
│  └── isSuperAdmin       └── manage_settings   └── ...         │
│         │                      │                    │         │
│         │     UI 条件渲染       │    按钮显示/隐藏    │  导航可见│
│         ▼                      ▼                    ▼         │
│  "升级 Pro" 按钮       "创建 Agent" 按钮      侧边栏/handler  │
│  仅 Free 用户可见      仅 Pro/Admin 可见       按角色控制      │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                       tRPC 调用                              │
│                                                              │
│  所有 API 调用统一走 authedProcedure                         │
│  → serverDatabase 中间件                                      │
│  → withRbacPermission(code) 权限门控                          │
│  → creditBalanceCheck 积分余额检查（AI 调用类 API）           │
│  → 业务 handler                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                      后端中间件链                             │
│                                                              │
│  assertPermission(ctx, codes, mode)                           │
│    │                                                          │
│    ├── ① ctx.userId 存在？ → 否则 401                        │
│    ├── ② users.isRoot === true？ → 直接放行（短路）          │
│    ├── ③ RbacModel.hasPermission(userId, workspaceId)        │
│    │      ├── 查 rbac_user_roles（活跃角色）                  │
│    │      ├── 查 rbac_role_permissions（角色权限）            │
│    │      └── mode='any' → 匹配任一；mode='all' → 匹配全部   │
│    └── ④ 权限不足 → 403 FORBIDDEN                            │
│                                                              │
│  creditBalanceCheck(ctx)                                      │
│    ├── ① 获取用户积分余额 (SUM credit_transactions.amount)    │
│    ├── ② 余额 ≤ 0 → 402 PAYMENT_REQUIRED                     │
│    └── ③ 余额 > 0 → 放行                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 RBAC 角色定义

```typescript
// free_user — 新用户注册自动分配
[SYSTEM_DEFAULT_ROLES.FREE_USER]: [
  // 基础聊天
  'session:create:owner', 'session:read:owner', 'session:update:owner',
  'session:delete:owner',
  'message:create:owner', 'message:read:owner',
  // 使用 Discover agent
  'agent:read:all',          // 可浏览所有 agent（含官方发布）
  'agent:read:owner',        // 可读自己安装的 agent
  'agent:update:owner',      // 可修改自己安装的 agent
  'agent:delete:owner',      // 可删除自己安装的 agent
  // AI 模型
  'ai_model:read:all',       // 查看可用模型列表（仅 admin 配置的）
  'ai_model:invoke:all',     // 调用模型（消耗积分）
  'ai_provider:read:all',    // 查看可用服务商
  // 文件
  'file:read:owner', 'file:upload:owner',
  'file:update:owner', 'file:delete:owner',
  // 文档
  'document:read:owner', 'document:create:owner',
  'document:update:owner', 'document:delete:owner',
  // 知识库
  'knowledge_base:read:owner', 'knowledge_base:create:owner',
  'knowledge_base:update:owner', 'knowledge_base:delete:owner',
  // 个人设置
  'user:read:all',           // 查看用户信息（含他人基本资料）
  'user:update:owner',       // 修改自己资料
  'api_key:create:owner', 'api_key:read:owner',
  'api_key:update:owner', 'api_key:delete:owner',
],

// pro_user — 新角色，替代旧 vip_user（旧 vip_user 并入 pro_user）
[SYSTEM_DEFAULT_ROLES.PRO_USER]: [
  // 包含 free_user 全部权限...
  ...FREE_USER_PERMISSIONS,

  // PLUS: 创建/发布能力
  'agent:create:all',        // 创建新 agent
  'agent:fork:all',          // fork agent
  'agent:publish:owner',     // 发布自己的 agent 到 Discover（待审核）
  'group:publish:owner',     // 发布自己的 group
  'ai_model:create:owner',   // 创建自定义模型配置
  'ai_provider:create:owner', // 添加自定义 AI 服务商
  'ai_provider:update:owner',
],
```

### 2.3 前后端权限协作时序

以"Free 用户尝试创建 Agent"为例：

```
用户点击 "创建 Agent" 按钮
    │
    ▼
前端 usePermission('create_content')
    │
    ├── 查 ACTION_PERMISSION_MAP['create_content']
    │   = ['agent:create:all', 'agent:create:owner']
    │
    ├── 查用户持有权限列表 (SWR 缓存)
    │   = ['agent:read:all', 'session:create:owner', ...]  ← free_user
    │
    ├── 匹配: codes.some(code => userPermissions.includes(code))
    │   → false（free_user 没有 agent:create:*）
    │
    └── 返回 { allowed: false }
            │
            ▼
        "创建 Agent" 按钮隐藏或置灰 + tooltip "升级 Pro 即可创建"
            │
            ▼
        用户点击 "升级 Pro" → 跳转订阅页面

──────── 如果用户绕过前端直接调 API ────────

POST /api/trpc/agent.create
    │
    ▼
authedProcedure → 验证登录
    │
    ▼
withRbacPermission('agent:create:all')
    │
    ├── assertPermission(ctx, ['agent:create:all'], 'any')
    │
    ├── isRoot？ → false
    ├── RbacModel.hasPermission('agent:create:all')
    │   → 查 rbac_user_roles: free_user
    │   → 查 rbac_role_permissions: [agent:read:owner, ...]
    │   → 'agent:create:all' 不在列表中
    │
    └── 返回 403 FORBIDDEN { message: "Missing required permission: agent:create:all" }
```

### 2.4 积分消费时序

以"用户发送 AI 聊天消息"为例：

```
用户输入消息 → 点击发送
    │
    ▼
前端 creditBalanceStore.getBalance()
    │
    ├── balance > 0 → 显示发送按钮，允许发送
    └── balance ≤ 0 → 按钮置灰 + banner "积分不足，去充值"
            │
            ▼
        跳转 /settings/billing 充值页面

──── 积分充足，正常流程 ────

POST /api/trpc/chat.sendMessage
    │
    ▼
authedProcedure → 验证登录
    │
    ▼
withRbacPermission('ai_model:invoke:all') → free_user 有，放行
    │
    ▼
creditBalanceCheck 中间件
    │
    ├── 查 credit_transactions.SUM(amount) WHERE user_id = ctx.userId
    ├── balance = 500 → > 0 → 放行
    └── （余额不足时返回 402 PAYMENT_REQUIRED）
    │
    ▼
AI 模型调用
    │
    ▼
计算消耗积分（按 token 消耗 + 积分汇率）
    │
    ▼
事务写入:
    credit_transactions.insert({ type: 'consumption', amount: -N, balanceAfter, source: 'api_call' })
    spend_logs.insert({ userId, modelId, promptTokens, completionTokens, totalCost, creditsConsumed })
    │
    ▼
返回 AI 响应 + 本次消耗积分明细
```

---

## 三、Free User Pro-Gating UX 设计

### 3.1 设计原则

**展示但不隐藏，锁定但可感知。** 让 Free 用户知道所有功能的存在，产生"想要"的欲望，但又明确告知"升级 Pro 即可解锁"。

```
隐藏（❌ 不可取）               锁定 + Pro 标识（✅ 推荐）
─────────────────              ─────────────────────
用户看不到功能 →              功能可见但带锁 →
不知道有什么 →                 知道有什么但用不了 →
无升级动力                     有明确升级动力
```

### 3.2 各场景 Pro-Gating 方案

#### 场景 A：操作按钮

```
┌─────────────────────────────────────────────────────┐
│  [🔒 创建 Agent]  PRO          [🔒 发布到 Discover]  PRO  │
│    ↑ 置灰 + 锁图标               ↑ 同样处理               │
│  hover: "升级 Pro 即可创建 Agent"                       │
│  click: 弹出升级 Modal                                  │
└─────────────────────────────────────────────────────┘
```

**实现**：`<ProGate>` 包裹组件
```tsx
<ProGate
  feature="create_agent"
  fallback={
    <Tooltip title="升级 Pro 即可创建 Agent">
      <Button disabled icon={<LockIcon />}>
        创建 Agent
        <Badge>PRO</Badge>
      </Button>
    </Tooltip>
  }
>
  <Button onClick={handleCreate}>创建 Agent</Button>
</ProGate>
```

#### 场景 B：侧边栏/导航菜单项

```
侧边栏
├── 🏠 首页
├── 🔍 发现
├── 🤖 Agent
│   ├── 我的 Agent
│   └── 创建 Agent  🔒 PRO     ← Pro 标识
├── 👥 群组  🔒 PRO            ← 整个菜单项带锁
├── 📄 页面
├── 🖼️ 图片
└── ...
```

**实现**：菜单项配置增加 `proRequired: true`
```tsx
{
  icon: Users,
  label: '创建群组',
  path: '/groups/create',
  proRequired: true,  // ← 标记需要 Pro
}
```

#### 场景 C：设置页面中的配置项

```
AI 服务商设置
┌─────────────────────────────────────┐
│  系统默认服务商                       │
│  ├── OpenAI  ✅ 可用                 │
│  └── 智谱AI  ✅ 可用                 │
│                                     │
│  自定义服务商  🔒 PRO                │
│  ┌─────────────────────────────┐    │
│  │  [API Key]  [________________] │  │  ← 输入框置灰
│  │  [添加服务商]  升级 Pro 解锁 →  │  │  ← 按钮变升级链接
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**实现**：设置区域顶部加 Pro banner
```tsx
{!isPro && (
  <Alert
    type="info"
    message="自定义 AI 服务商是 Pro 功能"
    action={<Button type="link">升级 Pro →</Button>}
  />
)}
{/* 配置区域 disable={!isPro} */}
```

#### 场景 D：列表页中的创建入口

```
Agent 列表页
┌──────────────────────────────────────────┐
│  我的 Agent                    [🔒 新建] PRO │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 📝 官方助手         已安装         │    │
│  │ 📝 代码助手         已安装         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ───────── 升级 Pro 解锁更多 ─────────    │
│  ✅ 创建自定义 Agent                      │
│  ✅ 发布到 Discover 市场                  │
│  ✅ 每月 5000 积分                        │
│  [立即升级 →]                             │
└──────────────────────────────────────────┘
```

#### 场景 E：发布/分享流程

```
点击 "发布到 Discover"（Free 用户）
    │
    ▼
┌─────────────────────────────────┐
│         🔒 Pro 专属功能          │
│                                 │
│  发布 Agent 到 Discover 市场     │
│  让更多人发现和使用你的 Agent     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ✅ 创建自定义 Agent       │   │
│  │ ✅ 发布到 Discover       │   │
│  │ ✅ 每月 5000 积分         │   │
│  │ ✅ 自定义 AI 服务商       │   │
│  └─────────────────────────┘   │
│                                 │
│  [升级 Pro  ¥10/月起]           │
│  [暂不升级]                     │
└─────────────────────────────────┘
```

### 3.3 Pro-Gating 清单

| 功能 | 位置 | Free 用户体验 | 触发升级入口 |
|------|------|-------------|-------------|
| 创建 Agent | Agent 列表页"新建"按钮、首页快捷入口 | 按钮置灰 + 🔒 PRO badge | hover tooltip + click Modal |
| 创建群组 | 侧边栏"群组"菜单 | 菜单项显示 🔒 PRO | click → 升级 Modal |
| 发布到 Discover | Agent 详情页"发布"按钮 | 按钮置灰 + 🔒 PRO badge | click → 升级 Modal |
| 自定义 AI 服务商 | `/settings/provider` 添加按钮 | 输入区置灰 + 顶部 Pro banner | banner 中"升级 Pro"链接 |
| 自定义 AI 模型 | `/settings/service-model` | 添加按钮变"升级解锁" | 直接跳转订阅页 |
| Fork Agent | Agent 详情页"Fork"按钮 | 按钮置灰 + 🔒 PRO badge | hover tooltip |
| 更多存储空间 | `/settings/storage` 用量条 | 超出时引导升级 | 升级 Modal |

### 3.4 升级 Modal → 订阅完整流程

**交互链路**：

```
Free 用户点击 🔒 PRO 按钮
    │
    ▼
UpgradeModal 弹出
    │
    │  ┌─────────────────────────────────┐
    │  │         升级到 Pro               │
    │  │                                 │
    │  │  解锁「创建自定义 Agent」等功能   │
    │  │                                 │
    │  │  ┌─────────┐  ┌─────────┐      │
    │  │  │ 月度 Pro  │  │ 年度 Pro  │      │
    │  │  │ ¥10/月   │  │ ¥99/年   │      │
    │  │  └─────────┘  └─────────┘      │
    │  │                                 │
    │  │  包含：✅ 创建Agent ✅ 发布      │
    │  │        ✅ 自定义服务商 ✅ 5K积分 │
    │  │                                 │
    │  │  [立即订阅 →]    [了解更多]      │
    │  └─────────────────────────────────┘
    │
    ├── 点击 "了解更多" → 跳转 /settings/billing（套餐详情对比页）
    │
    └── 点击 "立即订阅"（选择套餐后）
            │
            ▼
        POST topUpRouter.createOrder({ planId, amount, credits })
            │
            ▼
        打开支付页面（PaymentQRCode）
            │
            ├── 微信扫码支付
            ├── 或 支付宝支付
            └── 轮询订单状态
            │
            ▼
        支付成功 → wxpay/notify 回调
            │
            ├── 积分入账 (credit_transactions)
            ├── 自动分配 pro_user 角色
            ├── 订阅记录创建 (subscriptions)
            └── 前端收到通知 → 关闭 Modal → 页面刷新 → 功能解锁
```

**UpgradeModal 需要做的**：

1. **接收 `feature` 参数**，根据触发来源显示不同标题和文案
2. **调用 `planRouter.listPlans`**（不需要 auth，公开接口），展示可选套餐
3. **选择套餐后调用 `topUpRouter.createOrder`**（需要登录），跳转支付
4. **支付状态轮询**，每 3 秒查一次 `topUpRouter.queryOrder`
5. **支付成功后**：
   - toast "订阅成功，Pro 功能已解锁"
   - 关闭 Modal
   - 前端刷新 `useUserRoles`（SWR revalidate）→ `isPro` 变为 `true`
   - 页面上的 🔒 PRO 按钮自动变成正常按钮

### 3.5 组件抽象

```typescript
// src/features/ProGate/index.tsx

interface ProGateProps {
  feature: 'create_agent' | 'publish_agent' | 'create_group'
          | 'custom_provider' | 'custom_model' | 'fork_agent';
  children: React.ReactNode;
  // 可选：自定义锁定态渲染
  fallback?: React.ReactNode;
  // 可选：是否完全隐藏（特殊场景）
  hide?: boolean;
}

// 内部逻辑
function ProGate({ feature, children, fallback, hide }: ProGateProps) {
  const { isPro } = useUserRoles();

  if (isPro) return <>{children}</>;

  if (hide) return null;

  if (fallback) return <>{fallback}</>;

  // 默认锁定态：置灰按钮 + 🔒 + PRO badge
  return <DefaultProLock feature={feature} />;
}
```

---

## 四、核心业务流程

### 3.1 注册与初始化

```
POST /api/auth/register
    │
    ▼
UserService.initUser(user)
    │
    ├── ① 创建 users 记录
    │
    ├── ② assignSystemRoleToUser(FREE_USER)
    │      → rbac_user_roles.insert({ user_id, role_id: free_user })
    │
    ├── ③ initNewUserForBusiness(userId)
    │      │
    │      ├── 读取 credit_configs.defaultRegistrationCredits
    │      │   （admin 在管理面板可配置，如 500）
    │      │
    │      ├── credit_transactions.insert({
    │      │     type: 'bonus',
    │      │     amount: defaultRegistrationCredits,
    │      │     source: 'registration',
    │      │     description: '注册赠送积分'
    │      │   })
    │      │
    │      └── 如果注册时携带 inviteCode:
    │            ├── 查询 inviteCode 对应的邀请人 userId
    │            ├── 双方各得 referralRewardCredits 积分
    │            ├── credit_transactions.insert({ userId: inviter, type: 'bonus', ... })
    │            └── credit_transactions.insert({ userId: newUser, type: 'bonus', ... })
    │
    └── ④ 返回注册成功 + 初始积分余额
```

### 3.2 充值/订阅 → Pro 升级

```
用户购买套餐
    │
    ▼
POST topUp.createOrder({ planId, amount, credits })
    │
    ▼
payment_orders.insert({ userId, planId, amount, credits, status: 'pending' })
    │
    ▼
微信支付统一下单 → 用户扫码支付
    │
    ▼
POST /webapi/wxpay/notify（微信回调）
    │
    ├── 验签 → 更新 payment_orders.status = 'paid'
    │
    ├── credit_transactions.insert({ type: 'top_up', amount: credits })
    │
    ├── 会员升级检查:
    │   │
    │   ├── 如果是订阅套餐:
    │   │   subscriptions.insert({ userId, planId, status: 'active', ... })
    │   │   ↓
    │   │   自动升级:
    │   │   update users.membershipLevelId = plan 对应的 level
    │   │   assignSystemRoleToUser(PRO_USER)  ← 关键：分配 pro_user 角色
    │   │
    │   └── 如果是纯充值积分:
    │       累计充值总额 = SUM(payment_orders.amount) WHERE status = 'paid'
    │       ↓
    │       匹配 membership_levels.minRechargeTotal
    │       ↓
    │       如果达到某等级门槛：
    │       update users.membershipLevelId → assignSystemRoleToUser(PRO_USER)
    │
    └── 发送通知（站内信/邮件）
```

### 3.3 等级降级

```
定时任务（每日凌晨 / 或每月初）
    │
    ▼
查询所有 subscriptions.status = 'active' 的用户
    │
    ├── 已过期且未续费 → 检查是否还有其他活跃订阅
    │   ├── 无 → 检查累计充值是否达到当前 membership 等级门槛
    │   │   ├── 达到 → 保持等级
    │   │   └── 未达到 → 降级到上一等级
    │   │               └── 如果降到 level=0 (Free):
    │   │                   removeSystemRoleFromUser(PRO_USER)
    │   │                   assignSystemRoleToUser(FREE_USER)
    │   │                   （保留已获得的积分余额，不扣回）
    │   └── 有 → 保持等级
    │
    └── 日志记录所有等级变更
```

### 3.4 邀请/推荐

```
用户 A 生成邀请码
    │
    ▼
GET referralRouter.generateInviteCode()
    │
    ├── 查 invite_codes 表，用户 A 的活跃邀请码
    │   ├── 已有 → 返回现有码
    │   └── 没有 → 生成新码（6-8 位字母数字）→ invite_codes.insert({ userId: 'A', code, status: 'active' })
    │
    └── 返回 { code, url: `${BASE_URL}/signup?invite=${code}` }
            │
            ▼
用户 A 分享给 B → B 用邀请码注册
    │
    ▼
POST /api/auth/register { inviteCode: "ABC123", ... }
    │
    ▼
initNewUserForBusiness()
    │
    ├── 验证 inviteCode 有效且未被使用
    ├── credit_transactions.insert({ userId: 'A', type: 'bonus', amount: referralRewardCredits, source: 'referral' })
    ├── credit_transactions.insert({ userId: 'B', type: 'bonus', amount: referralRewardCredits, source: 'referral' })
    ├── invite_codes.update({ status: 'used', usedByUserId: 'B' })
    └── 双方各收到站内通知

用户 A 查看推荐记录
    │
    ▼
GET referralRouter.getMyReferrals()
    │
    └── 返回 { totalInvited, totalCreditsEarned, referrals: [{ user, joinedAt, creditsEarned }] }
```

---

## 四、开发计划

### 阶段 0️⃣：基础设施（✅ 已完成）

| # | 任务 | 状态 |
|---|------|------|
| 0.1 | Git 初始化 + `feature/commercial-saas-v1` 分支 | ✅ |
| 0.2 | Pre-commit hooks（lint-staged + Prettier） | ✅ |
| 0.3 | DB Schema: `payment_orders`, `membership_levels`, `refund_requests`, `dict_configs` | ✅ |
| 0.4 | Models + tRPC Routers for above tables | ✅ |
| 0.5 | Admin UI: 字典配置、会员等级、支付订单、退款审核、角色详情 | ✅ |
| 0.6 | `users.membershipLevelId` 字段 | ✅ |
| 0.7 | i18n 完整翻译 | ✅ |

### 阶段 1️⃣：RBAC 权限重构（3-4 小时）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1.1 | 修改 `free_user` 权限定义 | `packages/const/src/rbac.ts` | 补充 session/message/file/document/knowledge_base/ai_model 等基础权限（详见 2.2 节） |
| 1.2 | **新建 `pro_user` 角色** | `packages/const/src/rbac.ts` | 继承 free_user 全部权限 + agent:create/fork/publish + ai_provider:create 等 |
| 1.3 | 更新系统角色种子 | `packages/database/src/utils/seedSystemRoles.ts` | 新增 `pro_user` 角色种子 |
| 1.4 | 更新前端角色检测 | `src/hooks/useUserRoles.ts` | 新增 `isPro` 判断（优先级: super_admin > pro_user > free_user） |
| 1.5 | 更新前端权限映射 | `src/hooks/usePermission.ts` | 补充 `subscribe_plan`、`publish_content` 等新 action |
| 1.6 | 更新 Feature Flags | `packages/app-config/src/featureFlags/schema.ts` | 新增加 `nav_*_for_pro_user` 系列开关 |
| 1.7 | 更新导航/侧边栏 Pro 标识 | `src/hooks/useNavLayout.ts`, AdminSidebar | Pro 功能菜单项显示 🔒 PRO badge，非隐藏 |
| 1.8 | 新建 `<ProGate>` 组件 | `src/features/ProGate/index.tsx` | 统一 Pro-Gating 包裹组件：自动检测 isPro → 渲染 children 或锁定态 |
| 1.9 | 新建 `<UpgradeModal>` 组件 | `src/features/ProGate/UpgradeModal.tsx` | 升级弹窗：根据 feature 显示对应文案 + 套餐选择 |
| 1.10 | 各场景接入 ProGate | 按钮/菜单/设置页面 | 详见 3.3 Pro-Gating 清单 |
| 1.11 | 更新 i18n | `src/locales/default/admin.ts` + auth.ts | `pro_user` 角色名称、Pro 锁定提示文案、升级 Modal 文案 |

> **校验标准**：运行 `bun run type-check` 零错误；lint 零错误；`free_user` 能创建 session/发消息/上传文件；`pro_user` 能创建 agent

### 阶段 2️⃣：积分消费逻辑（4-5 小时）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 2.1 | 新增 `creditBalanceCheck` 中间件 | `packages/business-server/src/trpc-middlewares/creditBalance.ts` | 在 AI 调用类 API 前检查积分余额，不足则返回 402 |
| 2.2 | 实现 AI 调用积分扣减 | `packages/business-server/src/model-runtime.ts` | 在 `getBusinessModelRuntimeHooks` 中实现 `beforeInvoke`（余额检查）和 `afterInvoke`（积分扣减 + spend_log） |
| 2.3 | 实现图片生成积分扣减 | `packages/business-server/src/image-generation/` | 填充 `chargeBeforeGenerate`（余额检查）和 `chargeAfterGenerate`（扣减积分） |
| 2.4 | 实现视频生成积分扣减 | `packages/business-server/src/video-generation/` | 同上 |
| 2.5 | 积分汇率计算工具 | `packages/business-server/src/utils/creditPricing.ts` | `calculateCreditsByTokens(promptTokens, completionTokens, modelId)` 按模型定价计算消耗积分 |
| 2.6 | 前端积分余额展示 | `src/features/` 公共组件 | Header 显示余额 + 充值入口；余额不足 banner 提示 |
| 2.7 | 前端积分消费确认 | 聊天输入框等 | 余额检查：≤ 0 时禁用发送按钮，引导充值 |
| 2.8 | Admin 积分汇率配置 | `src/features/Admin/Plans/PlanList.tsx` | 新增模型级积分定价配置（已有 `pricePerCredit`，可扩展） |

> **校验标准**：Free 用户发消息 → 积分减少 → spend_log 记录完整；余额为 0 → 返回 402 + 前端禁用输入

### 阶段 3️⃣：注册赠送 + 邀请系统（3-4 小时）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 3.1 | `credit_configs` 新增 `defaultRegistrationCredits` | Schema + Migration + Admin UI | admin 配置注册赠送积分数 |
| 3.2 | 实现 `initNewUserForBusiness` | `packages/business-server/src/user.ts` | 注册时写入 bonus credit_transactions；处理 inviteCode |
| 3.3 | 新增 `invite_codes` 表 | Schema + Model | id, userId, code, status, usedByUserId, usedAt |
| 3.4 | 填充 `referralRouter` | `packages/business-server/src/lambda-routers/referral.ts` | generateInviteCode, getMyReferrals, getReferralStats |
| 3.5 | 修改注册流程支持 inviteCode | `apps/server/src/services/user/index.ts` | 在 initUser 中传递 inviteCode 给 initNewUserForBusiness |
| 3.6 | 前端邀请页面（原生） | `src/features/Referral/` | 替换 iframe：展示邀请码、邀请链接、推荐记录、累计收益 |
| 3.7 | Admin 邀请奖励配置 | `src/features/Admin/Plans/PlanList.tsx` | `referralRewardCredits` 已有，确认配置可用 |

> **校验标准**：用户 A 生成邀请码 → B 用码注册 → 双方各获得 admin 配置的积分 → 推荐记录可查

### 阶段 4️⃣：订阅 → Pro 升级桥接（3-4 小时）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 4.1 | 实现 `getSubscriptionPlan` | `packages/business-server/src/user.ts` | 替换 stub，真正查询 subscriptions 表 |
| 4.2 | 新增 `MembershipService` | `packages/business-server/src/services/membership.ts` | 统一升级/降级逻辑：calculateLevel → updateMembership → assignRole |
| 4.3 | 支付回调中集成升级逻辑 | `src/app/(backend)/webapi/wxpay/notify/route.ts` | 支付成功 → 积分入账 → 检查升级 → 分配 pro_user 角色 |
| 4.4 | 定时降级任务 | `apps/server/src/app/(backend)/trpc/...` 或 cron | 每日检查过期订阅 → 降级 → 移除 pro_user 角色 |
| 4.5 | Pro 到期提醒 | 通知系统 | 到期前 7 天/3 天/1 天发送站内信 + 邮件 |
| 4.6 | 前端 Pro 状态展示 | `src/features/` | Profile 页面展示会员等级 + 到期时间 + 续费按钮 |

> **校验标准**：用户订阅套餐 → 自动成为 pro_user → 可创建 agent；到期 → 自动降级为 free_user

### 阶段 5️⃣：用户端原生页面（3-4 小时）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 5.1 | 原生支付页面 | `src/features/TopUp/` | PlanSelector + PaymentQRCode + OrderStatus，替换 SubscriptionIframeWrapper |
| 5.2 | 原生积分页面 | `src/features/Credits/` | 积分余额 + 交易记录列表 + 充值入口 |
| 5.3 | 原生套餐页面 | `src/features/Plans/` | 套餐对比 + 订阅按钮 |
| 5.4 | 原生邀请页面 | `src/features/Referral/` | 邀请码/链接 + 推荐记录 |
| 5.5 | 计费设置路由 | `src/routes/(main)/settings/billing/` | 整合所有计费子页面 |

> **校验标准**：Web 端非 desktop 也能看到原生页面（不再返回 null）；桌面端保留 iframe 作为 fallback

### 阶段 6️⃣：集成测试与清理（2-3 小时）

| # | 任务 | 说明 |
|---|------|------|
| 6.1 | 端到端测试：注册 → 聊天消耗积分 → 充值 → 升级 Pro → 创建 agent | 完整用户旅程验证 |
| 6.2 | 权限穿透测试：Free 调 Pro API → 403 / Pro 调 Admin API → 403 | 确保后端权限中间件覆盖所有新增 API |
| 6.3 | 积分边界测试：余额 0 → 余额负 → 并发消费 | 防止积分透支 |
| 6.4 | 清理旧代码：移除 `vip_user` 角色引用、清理未使用的 stub | 保持代码整洁 |
| 6.5 | 更新 PRD + README | 文档同步 |

---

## 五、文件变更清单

### 新增文件

```
packages/database/src/schemas/
├── inviteCodes.ts                        # [NEW] 邀请码表

packages/database/src/models/
├── inviteCodes.ts                        # [NEW] 邀请码 Model

packages/business-server/src/
├── services/membership.ts                # [NEW] 会员等级升级/降级服务
├── trpc-middlewares/creditBalance.ts     # [NEW] 积分余额检查中间件
├── utils/creditPricing.ts               # [NEW] 积分定价计算工具
└── lambda-routers/referral.ts           # [MODIFY] 从空 stub 填充满

src/features/
├── TopUp/                                # [NEW] 原生支付页面
│   ├── PlanSelector.tsx
│   ├── PaymentQRCode.tsx
│   └── OrderStatus.tsx
├── Referral/                             # [NEW] 原生邀请页面
│   ├── ReferralPage.tsx
│   ├── InviteCodeCard.tsx
│   └── ReferralHistory.tsx
├── Credits/                              # [NEW] 原生积分页面
│   └── CreditBalance.tsx
└── Plans/                                # [NEW] 原生套餐页面
    └── PlanComparison.tsx

docs/prd/
└── lobehub-commercial-v2.md              # [NEW] 本文档
```

### 修改文件

```
packages/const/src/rbac.ts               # [MODIFY] free_user 权限补充 + 新增 pro_user
packages/database/src/utils/seedSystemRoles.ts  # [MODIFY] 新增 pro_user 种子
packages/business-server/src/user.ts     # [MODIFY] getSubscriptionPlan + initNewUserForBusiness
packages/business-server/src/model-runtime.ts   # [MODIFY] AI 调用积分扣减
packages/business-server/src/image-generation/  # [MODIFY] 图片生成积分扣减
packages/business-server/src/video-generation/  # [MODIFY] 视频生成积分扣减
apps/server/src/services/user/index.ts   # [MODIFY] initUser 传递 inviteCode
apps/server/src/routers/lambda/index.ts   # [MODIFY] 注册新 router
src/hooks/useUserRoles.ts                 # [MODIFY] 新增 isPro
src/hooks/usePermission.ts                # [MODIFY] 新增 action
src/hooks/useNavLayout.ts                 # [MODIFY] pro_user 导航
src/spa/router/desktopRouter.config.tsx   # [MODIFY] 新增路由
src/spa/router/desktopRouter.config.desktop.tsx  # [MODIFY] 新增路由
src/locales/default/admin.ts              # [MODIFY] 新增 i18n
src/locales/default/auth.ts               # [MODIFY] 新增角色描述 i18n
```

---

## 六、关键技术决策

### 6.1 为什么不用 `vip_user` 而是新建 `pro_user`？

- `vip_user` 从未被分配给任何用户，历史包袱为零
- "Pro" 比 "VIP" 更符合商业 SaaS 的命名惯例
- 新建角色避免和旧权限定义产生混淆
- 旧 `vip_user` 角色保留不动，向前兼容

### 6.2 为什么积分检查在前端和后端各做一次？

- **前端**：优化 UX，提前禁用按钮避免无效请求
- **后端**：安全底线，防绕过。前端 `allowed` 乐观允许（loading 状态），后端是最终守门人
- 前端检查免费，后端检查保安全

### 6.3 为什么积分余额用中间件而非业务代码？

- **统一**：所有 AI 调用类 API 共用一个中间件，不到处散落 `if balance <= 0`
- **可测试**：中间件独立单元测试，不依赖业务逻辑
- **可扩展**：未来加限流/熔断/降级只需改中间件

### 6.4 会员等级和 RBAC 角色的关系

```
membership_levels（商业化等级）
    ├── level 0: Free → 触发 RBAC free_user
    └── level ≥ 1: Pro → 触发 RBAC pro_user

RBAC 角色（技术权限）
    ├── free_user → 基础权限（聊天、Discover agent、文件）
    └── pro_user → 全功能（创建 agent、自定义 provider、发布审核）
```

**等级驱动角色，角色决定权限。** 等级变更（升级/降级）自动触发角色切换。

---

## 七、数据模型关系图

```
users ──────────────────────────────────────────────┐
  │ membershipLevelId ──── membership_levels          │
  │                          ├── name, level, slug    │
  │                          ├── minRechargeTotal     │
  │                          ├── monthlyCreditsBonus  │
  │                          ├── storageBonusMB       │
  │                          └── features (JSONB)     │
  │                                                   │
  ├── (rbac_user_roles) ─── rbac_roles               │
  │                          ├── free_user            │
  │                          ├── pro_user             │
  │                          └── super_admin          │
  │                                                   │
  ├── payment_orders                                  │
  │   ├── planId ───────── plans                      │
  │   │                    ├── name, price             │
  │   │                    ├── monthlyCredits          │
  │   │                    └── billingCycle            │
  │   └── status: pending/paid/expired/refunded       │
  │                                                   │
  ├── subscriptions                                   │
  │   ├── planId ───────── plans                      │
  │   └── status: active/canceled/expired             │
  │                                                   │
  ├── credit_transactions                             │
  │   ├── type: top_up/bonus/consumption/refund       │
  │   ├── amount (+收入/-支出)                         │
  │   ├── source: payment/referral/api_call/...       │
  │   └── balanceAfter                                │
  │                                                   │
  ├── spend_logs                                      │
  │   ├── modelId, providerId                         │
  │   ├── promptTokens, completionTokens              │
  │   ├── inputCost, outputCost, totalCost             │
  │   └── creditsConsumed                             │
  │                                                   │
  └── invite_codes                                    │
      ├── userId, code, status                        │
      └── usedByUserId, usedAt                        │
```

---

## 八、验收标准

| # | 场景 | 预期结果 |
|---|------|---------|
| 1 | 新用户注册 | 自动获得 free_user 角色 + admin 配置的新手积分 |
| 2 | Free 用户聊天 | 可创建 session、发消息、消耗积分 |
| 3 | Free 用户看到"创建 Agent"按钮 | 按钮置灰 + 🔒 PRO badge，hover tooltip "升级 Pro 即可创建"，点击弹出升级 Modal；后端 403 |
| 3a | Free 用户看到侧边栏 Pro 功能 | 菜单项显示 🔒 PRO 标识，非隐藏 |
| 3b | Free 用户看到 AI 服务商设置 | 自定义服务商区域置灰 + Pro banner，系统默认服务商正常可用 |
| 4 | 积分耗尽 | 前端禁用发送 + 后端 402，引导充值 |
| 5 | 订阅套餐 | 支付成功 → pro_user 角色 → 可创建 agent |
| 6 | 套餐到期 | 定时降级 → 变回 free_user → 保留未消耗积分 |
| 7 | 生成邀请码 | 分享链接 → 被邀请人注册 → 双方各获得配置积分 |
| 8 | Admin 配置 | 修改新手积分/推荐奖励/积分汇率 → 即时生效 |
| 9 | 积分消费记录 | spend_logs 完整：tokens/cost/creditsConsumed/模型/用户 |
| 10 | 权限穿透 | 绕过前端的 API 调用被后端 403 拦截 |
