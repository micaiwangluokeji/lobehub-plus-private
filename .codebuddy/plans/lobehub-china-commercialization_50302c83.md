---
name: lobehub-china-commercialization
overview: LobeHub 面向中国 C 端商业化：P0 微信支付 SDK 集成 + 会员等级体系，P1 管理员 RBAC UI 优化 + 退款系统 + 字典配置系统，以及 Git 仓库初始化和分支管理。
todos:
  - id: git-init
    content: 初始化 Git 仓库并完成首次提交：git init → git add --all → git commit，然后创建 feature/commercial-saas-v1 分支
    status: completed
  - id: batch-0-precommit
    content: 使用 [skill:setup-pre-commit] 配置 Husky pre-commit hooks（Prettier + TypeScript 类型检查）
    status: completed
    dependencies:
      - git-init
  - id: batch-0-dict-schema
    content: 新增 dict_configs 数据库 Schema 和 Model，填充 dictConfigRouter 后端 CRUD，开发 DictConfigList 管理页面，注册路由并添加 i18n
    status: completed
    dependencies:
      - git-init
  - id: batch-1-wxpay-schema-router
    content: 新增 payment_orders DB Schema + Model，填充 topUpRouter（createOrder/queryOrder/wxPayNotify），创建微信支付回调 Route Handler
    status: completed
    dependencies:
      - git-init
  - id: batch-1-wxpay-user-ui
    content: 开发用户端原生支付页面（PlanSelector + PaymentQRCode + OrderStatus），替换 Billing/Plans/Credits 的 iframe 嵌入，开发 Admin 订单管理页
    status: completed
    dependencies:
      - batch-1-wxpay-schema-router
  - id: batch-1-membership
    content: 新增 membership_levels DB Schema + Model + Router，开发 MembershipLevelList 管理页，修改 users 表新增字段，实现充值后自动升级检查逻辑
    status: completed
    dependencies:
      - git-init
  - id: batch-2-refund
    content: 新增 refund_requests DB Schema + Model + Router，开发 RefundRequestList 审核页和用户端退款申请流程，实现退款执行（调微信退款 API + 积分扣回）
    status: completed
    dependencies:
      - batch-1-wxpay-schema-router
  - id: batch-2-rbac-ui
    content: 优化 RoleForm 嵌入权限配置面板（一步配置），新增 RoleDetail 独立页面，注册路由 /admin/roles/:id
    status: completed
    dependencies:
      - git-init
  - id: batch-2-prd-update
    content: 更新 .codebuddy/lobehub-admin-prd.md 到 v1.6，记录新增模块和商业化功能
    status: completed
    dependencies:
      - batch-2-refund
      - batch-2-rbac-ui
---

## 产品概述

将 LobeHub 打造成面向中国 C 端用户的商业化 SaaS 平台。在不破坏现有架构的前提下，补齐支付、会员、退款、配置管理等商业运营能力，同时优化管理员权限管理体验。

## 核心功能

### 批次一（P0 必须做）

1. **Git 仓库初始化**：首次提交所有源码，创建 `feature/commercial-saas-v1` 开发分支
2. **微信支付 SDK 深度集成**：实现统一下单（Native/H5/JSAPI）、支付回调处理、订单状态管理、用户端原生支付页面替换 iframe 嵌入
3. **会员等级体系**：定义多级会员（普通/银卡/金卡/钻石），每级配置专属权益（赠送积分/存储空间/专属模型/优先支持），实现购买套餐自动升级、到期自动降级机制

### 批次二（P1 应该做）

4. **管理员 RBAC UI 优化**：创建角色时支持一步配置权限分组、新增角色详情独立页面（展示角色信息+已分配权限+已分配用户列表）
5. **退款系统**：退款申请 → 审核 → 执行（微信支付退款 API 调用 + 积分扣回）→ 通知的完整闭环
6. **字典配置系统**：通用的 key-value 动态配置管理，管理员可在后台管理任意系统参数，前端通过统一接口读取

## 技术栈

- 后端：Next.js 16 + tRPC + Drizzle ORM + PostgreSQL
- 前端：React 19 + TypeScript + @lobehub/ui + antd
- 支付：微信支付 API V3（wechatpay-node-v3 SDK）
- 状态管理：zustand
- 数据获取：SWR

## 实现方案

### 总体策略

遵循现有架构模式：所有业务路由放 `packages/business-server/src/lambda-routers/`，DB Schema 放 `packages/database/src/schemas/`，Model 放 `packages/database/src/models/`，Admin UI 放 `src/features/Admin/`，路由入口放 `src/routes/(main)/admin/`。**不引入新架构概念**，复用现有的 tRPC 中间件链、RBAC 权限、i18n 体系。

### 微信支付 SDK 集成方案

- **选型**：使用 `wechatpay-node-v3`（微信官方 Node.js SDK），支持 API V3 签名和证书管理
- **新增 DB 表**：`payment_orders`（订单表：id, userId, amount, credits, status, prepayId, transactionId, wxCodeUrl/h5Url, paidAt, expiredAt, refundStatus, refundAmount）
- **新增 tRPC Router**：填充 `topUpRouter` 实现 `createOrder`（统一下单）、`queryOrder`（查询订单状态）、`wxPayNotify`（支付回调处理：验签 + 更新订单状态 + 发放积分 + 检查会员升级）
- **新增 Admin Router**：订单列表/详情查询、手动补单
- **用户端支付页面**：用原生 React 组件替换 `SubscriptionIframeWrapper`，实现：套餐选择 → 创建订单 → 展示支付二维码/跳转微信 → 轮询订单状态 → 支付成功回调
- **订单过期处理**：定时任务（通过 page/route API 触发或 cron job）关闭超时未支付订单
- **性能**：支付回调路径不走 tRPC，走 Next.js Route Handler（`src/app/(backend)/webapi/wxpay/notify/route.ts`），确保微信服务器能直接回调

### 会员等级体系方案

- **新增 DB 表**：`membership_levels`（id, name, slug, level 序号, minRechargeTotal, monthlyCreditsBonus, storageBonusMB, features JSONB, icon, color, enabled, sort）
- **修改 users 表**：新增 `membershipLevelId` 外键（可为 NULL = 普通用户）
- **升级逻辑**：用户累计充值金额达到某等级门槛 → 自动升级（在 `creditTransaction` 的 `top_up` 完成后检查）
- **降级逻辑**：定时检查用户近 N 个月累计充值是否低于当前等级门槛 → 降级。初期可简化为：仅在充值消费时检查，不做定时降级
- **等级权益**：monthlyCreditsBonus 在每月 1 日自动发放到用户积分账户；storageBonusMB 影响用户文件上传限额；features JSONB 控制功能开关（如是否可使用高端模型）
- **Admin UI**：等级列表页（MembershipLevelList.tsx）+ 创建/编辑表单 + 等级详情页

### 管理员 RBAC UI 优化方案

- **RoleForm 改造**：在创建角色 Modal 中嵌入 `RolePermissionPanel` 的权限 Checkbox 分组组件，支持创建时一步配置权限（复用已有组件逻辑，无重复代码）
- **新增 RoleDetail 页面**：路由 `/admin/roles/:id`，展示角色基本信息 + 已分配权限列表（按 category 分组）+ 已分配用户列表（支持搜索/分页）+ 编辑按钮 + 权限配置按钮
- **文件变更**：修改 `RoleForm.tsx`（嵌入权限配置）、新增 `RoleDetail.tsx`、新增路由文件 `src/routes/(main)/admin/roles/[id]/index.tsx`、注册到两个 desktopRouter config

### 退款系统方案

- **新增 DB 表**：`refund_requests`（id, userId, orderId, amount, reason, status: pending/approved/rejected/processing/completed/failed, reviewerId, reviewNote, wxRefundId, processedAt）
- **用户端**：订单列表页展示"申请退款"按钮（仅已支付且未超过退款期限的订单），填写退款原因 → 提交
- **管理员端**：退款审核列表（RefundRequestList.tsx）+ 审核操作（通过/拒绝 + 备注）
- **退款执行**：调用微信支付退款 API → 更新 refund_requests 状态 → 扣回对应积分（`credit_transactions` 插入 `type: 'refund'` 记录）→ 发送站内通知
- **积分扣回规则**：全额退款 = 扣回全部积分；部分退款 = 按比例扣回；已消费积分不足时拒绝退款

### 字典配置系统方案

- **新增 DB 表**：`dict_configs`（id, key 唯一, value JSONB, label, group, type: string/number/boolean/json, sort, description, enabled）
- **后端 Router**：`dictConfigRouter`（getByKey, getByGroup, list, create, update, delete）
- **Admin UI**：字典配置管理页（DictConfigList.tsx），按 group 分组展示，支持新增/编辑/删除条目，value 按 type 渲染不同的输入控件（string → Input, number → InputNumber, boolean → Switch, json → TextArea）
- **注册路由**：`/admin/dict-configs`
- **前端集成**：`useDictConfig(key)` hook 通过 SWR 获取单个配置值，替代 `SystemSettings.tsx` 中硬编码字段的读取方式，但**不删除现有硬编码字段**以保持向后兼容

## 目录结构

以下仅展示本次新增和修改的文件：

```
packages/database/src/schemas/
├── paymentOrders.ts          # [NEW] 支付订单表 Schema
├── membershipLevels.ts       # [NEW] 会员等级表 Schema
├── refundRequests.ts         # [NEW] 退款申请表 Schema
├── dictConfigs.ts            # [NEW] 字典配置表 Schema
├── paymentPlans.ts           # [MODIFY] 已有文件，无需修改
├── subscriptions.ts          # [MODIFY] 已有文件，无需修改
└── user.ts                   # [MODIFY] 新增 membershipLevelId 字段

packages/database/src/models/
├── paymentOrders.ts          # [NEW] 支付订单 Model
├── membershipLevels.ts       # [NEW] 会员等级 Model
├── refundRequests.ts         # [NEW] 退款申请 Model
└── dictConfigs.ts            # [NEW] 字典配置 Model

packages/business-server/src/lambda-routers/
├── topUp.ts                  # [MODIFY] 填充 createOrder/queryOrder/wxPayNotify
├── payment.ts                # [MODIFY] 新增订单管理 mutations
├── membershipLevel.ts        # [NEW] 会员等级 CRUD Router
├── refundRequest.ts          # [NEW] 退款申请/审核 Router
├── dictConfig.ts             # [NEW] 字典配置 CRUD Router
└── index.ts                  # [MODIFY] 注册新 Router

src/app/(backend)/webapi/wxpay/
└── notify/route.ts           # [NEW] 微信支付回调 Route Handler

src/features/Admin/
├── Membership/
│   └── MembershipLevelList.tsx  # [NEW] 会员等级列表页
├── Payment/
│   ├── PaymentSettings.tsx      # 已有，无需修改
│   └── OrderList.tsx            # [NEW] 支付订单列表页
├── Revenue/
│   └── RefundRequestList.tsx    # [NEW] 退款审核页
├── Settings/
│   ├── SystemSettings.tsx       # [MODIFY] 集成 dict 读取（向后兼容）
│   └── DictConfigList.tsx       # [NEW] 字典配置管理页
└── Roles/
    ├── RoleForm.tsx             # [MODIFY] 嵌入权限配置面板
    └── RoleDetail.tsx           # [NEW] 角色详情页

src/routes/(main)/admin/
├── membership/                  # [NEW] 会员等级路由
│   └── index.tsx
├── orders/                      # [NEW] 支付订单路由
│   └── index.tsx
├── roles/
│   └── [id]/index.tsx           # [NEW] 角色详情路由
├── refund-requests/             # [NEW] 退款审核路由
│   └── index.tsx
└── dict-configs/                # [NEW] 字典配置路由
    └── index.tsx

src/spa/router/
├── desktopRouter.config.tsx     # [MODIFY] 注册新 admin 路由
└── desktopRouter.config.desktop.tsx  # [MODIFY] 注册新 admin 路由

src/business/client/BusinessSettingPages/
├── Billing.tsx                  # [MODIFY] 替换 iframe 为原生组件
├── Plans.tsx                    # [MODIFY] 替换 iframe 为原生组件
├── Credits.tsx                  # [MODIFY] 替换 iframe 为原生组件
└── TopUp/                       # [NEW] 支付页面组件
    ├── PlanSelector.tsx         # 套餐选择器
    ├── PaymentQRCode.tsx        # 支付二维码展示
    └── OrderStatus.tsx          # 订单状态轮询

src/locales/default/admin.ts     # [MODIFY] 新增 i18n key
locales/en-US/admin.ts           # [MODIFY] 英文翻译
locales/zh-CN/admin.ts           # [MODIFY] 中文翻译

.codebuddy/lobehub-admin-prd.md  # [MODIFY] 更新 PRD 到 v1.6
```

## 实施注意事项

### 性能

- 支付回调路径走 Next.js Route Handler（不经 tRPC 中间件链），确保低延迟
- 字典配置通过 SWR 缓存 + stale-while-revalidate，避免重复请求
- 会员等级检查在充值/消费完成后异步触发（不阻塞主流程）

### 安全

- 支付回调验签：使用微信官方 SDK 的 verifyNotifySign 方法
- 退款权限：只有 `super_admin` 或具有 `payment:refund:all` 权限的管理员可操作
- 字典配置：仅管理员可写，前端只读

### 向后兼容

- 现有 `SystemSettings.tsx` 保留所有硬编码字段，新增字典配置作为补充而非替代
- 用户端 iframe 嵌入保留作为降级方案（feature flag 控制）
- 现有 `payment_configs` 表不变，新增的 `payment_orders` 表独立运行

### 数据库迁移

- 使用 Drizzle ORM 的标准迁移（`drizzle-kit generate` + `drizzle-kit migrate`）
- 新增表的默认值确保现有数据不受影响
- `users.membershipLevelId` 默认 NULL（普通用户），不强制要求等级

## Agent Extensions

### Skill

- **setup-pre-commit**
- 目的：为仓库配置 Husky pre-commit hooks，包含 Prettier 格式化 + TypeScript 类型检查
- 预期结果：提交前自动运行格式化和类型检查，保证代码质量

### SubAgent

- **code-explorer**
- 目的：在开发过程中搜索现有模式、参考实现、确认文件路径和 API 签名
- 预期结果：确保新增代码与现有架构一致，避免重复造轮子