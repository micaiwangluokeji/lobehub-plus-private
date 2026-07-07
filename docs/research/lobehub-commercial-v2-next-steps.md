# LobeHub 商业化 v2 — 后续执行计划

> 日期：2026-07-05  
> 分支：feature/commercial-saas-v2  
> 前置：PRD v2.0 6阶段后端开发已完成

---

## 一、数据库迁移（P0，30 分钟）

```bash
# 1. 生成迁移文件
bun run db:generate

# 2. 执行迁移
bun run db:migrate
```

**新增表**：`invite_codes`

**新增字段**：`credit_configs.default_registration_credits` (integer, default 500)

**新增权限码**：`billing:read`, `billing:manage`, `credit:read`, `credit:manage`, `subscription:read`, `subscription:manage`, `referral:read`

---

## 二、TypeScript 编译检查（P0，10 分钟）

```bash
bun run type-check
```

**可能报错点**：
- `rbac.ts` 新增 pro_user → 调用方需要 `case 'pro_user'`
- `SeededSystemRoles` 新增 `proUserRoleId` → 引用处需解构
- `user.ts` `getSubscriptionPlan` 签名变更 → 调用方需传 `db`

**修复优先顺序**：
1. `apps/server/src/routers/lambda/user.ts` — `getSubscriptionPlan(ctx.userId)` → `getSubscriptionPlan(ctx.userId, serverDB)`
2. `src/hooks/useUserRoles.ts` 中新增 `isPro` 可能触发类型扩散，先确认然后逐文件修复

---

## 三、前端页面组件（P1，12-15 小时）

> 服务层 (`src/services/billing.ts`) 和 SWR 键 (`src/libs/swr/keys.ts`) 已就绪。

### 3.1 ProGate 完整实现

**文件**：`src/features/ProGate/index.tsx`（骨架已存在，需填充）

```tsx
// DefaultProLock 组件实现
export function DefaultProLock({ feature }: { feature: ProFeature }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Tooltip title={FEATURE_TOOLTIP_MAP[feature]}>
        <Button disabled onClick={() => setModalOpen(true)}>
          <Lock size={14} />
          {FEATURE_LABEL_MAP[feature]}
          <ProBadge />
        </Button>
      </Tooltip>
      <UpgradeModal
        feature={feature}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
```

### 3.2 UpgradeModal

**文件**：`src/features/ProGate/UpgradeModal.tsx`（新建）

功能：
- 接收 `feature` 参数，显示对应解锁文案
- 调用 `planService.listPublicPlans()` 展示套餐卡片
- 用户选择套餐 → `topUpService.createOrder()` → 支付流程
- 支付成功 → `setTimeout(close, 2000)` → `SWR revalidate`

关键状态：
- `loading` — 加载套餐数据时 Skeleton
- `empty` — 无可用套餐时引导联系客服
- `error` — 加载失败时重试按钮

### 3.3 计费中心（Billing Center）

**路由**：`/settings/billing`（workspace-scoped）

**文件**：`src/routes/(main)/[workspaceSlug]/settings/billing/index.tsx`（修改）

功能：
- 当前套餐状态卡片（`subscriptionService.getActiveSubscription`）
- 积分余额卡片（`creditService.getMyBalance`）+ 充值入口
- 快捷入口：套餐对比/积分中心/用量统计/邀请好友/订单记录

### 3.4 其他页面

| 页面 | 路由 | 数据源 |
|------|------|--------|
| 套餐对比 | `billing/plans` | `planService.listPublicPlans` |
| 积分中心 | `billing/credits` | `creditService.getMyBalance` + `creditService.listMyHistory` |
| 用量统计 | `billing/usage` | 复用现有 spend logs 聚合查询 |
| 邀请好友 | `billing/referral` | `referralService.getMyReferrals` + `referralService.generateInviteCode` |
| 订单历史 | `billing/history` | `topUpService.listMyOrders` |
| 支付流程 | Modal/Drawer | `topUpService.createOrder` → `topUpService.queryOrder` 轮询 |

---

## 四、微信支付 SDK 接入（P0，4-5 小时）

**文件**：`src/app/(backend)/webapi/wxpay/notify/route.ts`（骨架已存在）

### 4.1 安装 SDK

```bash
bun add wechatpay-node-v3
```

### 4.2 统一下单

在 `topUpRouter.createOrder` 中调用微信统一下单 API：
```typescript
const result = await wxpay.v3.pay.transactions.native({
  appid: config.wechat.appId,
  mchid: config.wechat.mchId,
  description: `积分充值 ${credits} 积分`,
  out_trade_no: orderId,
  notify_url: `${BASE_URL}/webapi/wxpay/notify`,
  amount: { total: Math.round(amount * 100), currency: 'CNY' },
});
// 保存 code_url → payment_orders.wxCodeUrl
```

### 4.3 支付回调处理

```typescript
// route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('wechatpay-signature');
  // 1. 验签
  const verified = wxpay.verifySignature(signature, body);
  if (!verified) return new Response('FAIL', { status: 400 });

  // 2. 解密
  const { out_trade_no, transaction_id } = JSON.parse(body);

  // 3. 幂等检查 + 更新订单
  const order = await paymentOrdersModel.getById(out_trade_no);
  if (order?.status === 'paid') return new Response('SUCCESS'); // 幂等

  await paymentOrdersModel.markAsPaid(out_trade_no, transaction_id);

  // 4. 积分入账
  await creditTransactionsModel.create({ type: 'top_up', amount: order.credits });

  // 5. 检查会员升级
  const shouldUpgrade = await membershipService.calculateMembershipLevel(db, order.userId);
  if (shouldUpgrade.shouldUpgrade) {
    await assignSystemRoleToUser(db, { roleName: 'pro_user', userId: order.userId });
  }

  return new Response('SUCCESS');
}
```

### 4.4 Admin 支付配置 UI

`src/features/Admin/Payment/PaymentSettings.tsx` — 确认微信字段（appId/mchId/apiKey）可编辑。

---

## 五、定时任务（P1，2-3 小时）

### 5.1 订阅到期降级

**文件**：`src/app/(backend)/webapi/cron/route.ts`（新建）

```typescript
export async function GET(req: Request) {
  // 验证 cron secret
  // 查询 subscriptions WHERE current_period_end < NOW() AND status = 'active'
  // 对于每个过期订阅：
  //   update subscription status = 'expired'
  //   检查用户是否还有其他活跃订阅
  //   无 → removeSystemRoleFromUser(PRO_USER) + assignSystemRoleToUser(FREE_USER)
  //   发送站内通知
}
```

### 5.2 支付超时关单

```typescript
// 同上 cron route
// payment_orders WHERE expired_at < NOW() AND status = 'pending'
// → status = 'expired'
```

### 5.3 Cron 触发方式

- **开发/测试**：手动 GET `/webapi/cron`（带 secret header）
- **生产**：Vercel Cron Jobs 或外部 cron 服务（如 cron-job.org）定时调用

---

## 六、安全管理（P1，1-2 小时）

### 6.1 Admin 密码保护（Production）

生产环境中关闭开发模式的 AdminGuard 绕过：
```typescript
// src/features/Admin/Layout/AdminGuard.tsx
// 确认 __DEV__ 模式下跳过检查，生产环境严格校验 isSuperAdmin
```

### 6.2 支付回调密钥管理

- 微信 API V3 证书存储：环境变量 `WECHAT_API_CERT` + `WECHAT_API_KEY`
- 回调签名验证：使用 SDK 内置 `verifySignature`

### 6.3 积分并发扣减

`creditBalanceCheck` 中间件已有基本检查。如需防并发透支，在 `credit_transactions` 查询时加 `FOR UPDATE`：

```typescript
// 悲观锁确保同一用户并发调用不过量扣减
await db.transaction(async (tx) => {
  const balance = await tx
    .select({ sum: sql`coalesce(sum(amount), 0)` })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .for('update')
    .execute();
  // ... 余额检查 + 扣减
});
```

---

## 七、E2E 测试（P2，3-4 小时）

### 7.1 用户旅程测试

| # | 场景 | 验证点 |
|---|------|--------|
| 1 | 新用户注册 | free_user 角色 + defaultRegistrationCredits 积分到账 |
| 2 | Free 用户聊天 | 积分正确扣减 + spend_log 记录 |
| 3 | 积分耗尽 | 发送按钮禁用 + 402 返回 |
| 4 | 充值积分 | 支付回调 → 积分增加 |
| 5 | 订阅套餐 | pro_user 角色自动分配 |
| 6 | Pro 用户创建 agent | 无 403 错误 |
| 7 | 邀请注册 | 双方积分到账 + invite_code 标记 used |
| 8 | admin 修改积分 | 前端即时反映 |

### 7.2 权限穿透测试

| # | 场景 | 预期 |
|---|------|------|
| 1 | Free 调 `agent.create` | 403 |
| 2 | Free 调 admin API | 403 |
| 3 | Pro 调 admin API | 403 |
| 4 | SuperAdmin 所有 API | 200 |

---

## 八、开发任务汇总

| 步骤 | 任务 | 预估 | 优先级 |
|------|------|------|--------|
| 1 | `bun run db:generate` + `db:migrate` | 30 min | P0 |
| 2 | `bun run type-check` + 修复类型错误 | 30 min | P0 |
| 3 | ProGate 完整实现（DefaultProLock + 场景接入） | 2h | P1 |
| 4 | UpgradeModal 组件 | 2h | P1 |
| 5 | 计费中心 + 套餐对比页面 | 3h | P1 |
| 6 | 积分中心页面 | 2h | P1 |
| 7 | 邀请好友页面 | 1.5h | P1 |
| 8 | 支付流程 Modal（PlanSelector→QRCode→Status） | 2h | P1 |
| 9 | 用量统计 + 订单历史页面 | 1.5h | P2 |
| 10 | **计费页面移动端适配** | 2h | P1 |
| 11 | **iframe 降级策略（desktop保留iframe + Web原生）** | 30 min | P1 |
| 12 | **Admin Dashboard 商业化卡片（今日收入/活跃订阅/新用户/积分消耗）** | 1.5h | P1 |
| 13 | 微信支付 SDK 接入（统一下单 + 回调） | 4h | P0 |
| 14 | 定时任务（降级/关单/过期） | 2h | P1 |
| 15 | 管理员权限保护 | 1h | P1 |
| 16 | E2E 测试 | 3h | P2 |
| **总计** | | **29h** | |

---

## 九、待讨论事项 → 已确认

| # | 事项 | 决策 | 并入步骤 |
|---|------|------|---------|
| 1 | 移动端适配 | **需要**：计费页面专属移动端布局 | 步骤 3-9 |
| 2 | iframe 降级策略 | **保留**：桌面端 Electron 保留 iframe fallback，Web 端用原生 | 步骤 3-9 |
| 3 | 数据看板 | **需要**：Admin Dashboard 新增商业化卡片 | 新增步骤 14 |

---

## 十、新增任务

### 10.1 Admin Dashboard 商业化卡片（1.5h）

**文件**：`src/features/Admin/Dashboard/index.tsx`（修改）

新增 4 个统计卡片：

| 卡片 | 数据源 | 说明 |
|------|--------|------|
| 今日收入 | `payment_orders SUM(amount) WHERE paid_at = today` | 微信+支付宝合计 |
| 活跃订阅 | `subscriptions COUNT(*) WHERE status = 'active'` | 当前有效订阅数 |
| 新注册用户 | `users COUNT(*) WHERE created_at = today` | 今日新增 |
| 积分消耗 | `credit_transactions SUM(ABS(amount)) WHERE type='consumption' AND today` | 今日消耗积分 |

### 10.2 计费页面移动端适配（2h）

在 `src/routes/(mobile)/` 下新增计费相关路由：
```
src/routes/(mobile)/
└── settings/
    └── billing/
        ├── index.tsx          # 移动端计费中心
        ├── plans.tsx          # 移动端套餐对比
        └── credits.tsx        # 移动端积分中心
```

**移动端布局特点**：
- 套餐卡片纵向堆叠（非横向排列）
- 功能对比表折叠为 Accordion
- 支付 Modal 全屏
- 积分余额展示大字体居中
- 交易记录列表单列布局

### 10.3 iframe 降级策略实现（30min）

```typescript
// src/business/client/BusinessSettingPages/Billing.tsx
const Billing = memo(() => {
  const Component = isDesktop
    ? SubscriptionIframeWrapper  // Electron 桌面端保留 iframe
    : BillingCenter;              // Web 端用原生组件

  return <Component page="billing" />;
});
```

同理处理 Credits / Plans / Usage / Referral 页面。
