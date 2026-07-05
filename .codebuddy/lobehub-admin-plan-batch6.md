# LobeHub 管理后台第六批开发计划

## 第六批：商业运营功能

**计划状态**：`building` （执行中）
**创建日期**：2026-03-20
**预计工期**：12 个工作日
**开发范围**：收入仪表盘、订阅管理、积分交易管理、消费记录、内容审核、系统健康监控

---

## 一、概述

### 1.1 背景

管理后台前五个批次（基础管理、资源管理、AI 配置、扩展功能、商业配置）已完成 17 个模块，基础管理能力 100% 完成。但作为 AI Agent 商业化 SaaS 服务平台，**商业化运营能力几乎为零**——没有收入追踪、订阅管理、财务对账、内容审核、系统监控等核心 SaaS 功能，无法真正商业化运营。

### 1.2 目标

本批次完成后，管理后台将具备：
- ✅ 实时收入与订阅指标监控
- ✅ 用户订阅全生命周期管理
- ✅ 积分充值/消费流水对账
- ✅ Token 消耗明细与成本分析
- ✅ 内容审核与合规管理
- ✅ 系统健康实时监控

### 1.3 涉及变更

| 类型 | 数量 | 说明 |
|------|------|------|
| 数据库迁移 | 5 张新表 | subscriptions / credit_transactions / spend_logs / content_moderation_logs / system_health_checks |
| tRPC Router | 6 个 | revenue / subscription / creditTransaction / spend / contentModeration / systemHealth |
| tRPC Procedure | ~30 个 | 每个 Router 约 5 个 procedures |
| 前端页面 | 6 个 | 对应 6 个模块 |
| 前端服务层 | 6 个 | 对应 6 个模块的 API 调用 |
| i18n 文件 | 1 个 | admin.ts 补充新 key |
| 路由配置 | 6 处 | 添加新页面路由 |
| 菜单配置 | 1 处 | 添加"商业运营"菜单分组 |

---

## 二、数据库设计

### 2.1 subscriptions（订阅表）

```sql
CREATE TABLE "subscriptions" (
  "id" serial PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "plan_id" integer REFERENCES "plans"("id"),
  "status" varchar NOT NULL DEFAULT 'active',  -- active / canceled / expired / past_due
  "billing_cycle" varchar NOT NULL DEFAULT 'month',  -- month / year
  "current_period_start" timestamp NOT NULL,
  "current_period_end" timestamp NOT NULL,
  "canceled_at" timestamp,
  "cancel_reason" varchar,
  "payment_provider" varchar,  -- stripe / wechat / alipay
  "payment_subscription_id" varchar,  -- 第三方订阅 ID
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON "subscriptions"("user_id");
CREATE INDEX idx_subscriptions_status ON "subscriptions"("status");
CREATE INDEX idx_subscriptions_current_period_end ON "subscriptions"("current_period_end");
```

### 2.2 credit_transactions（积分交易表）

```sql
CREATE TABLE "credit_transactions" (
  "id" serial PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "type" varchar NOT NULL,  -- recharge / consumption / refund / bonus / adjustment
  "amount" integer NOT NULL,  -- 正数为收入，负数为支出
  "balance_after" integer NOT NULL,  -- 交易后余额
  "source" varchar,  -- payment / api_call / referral / admin_adjust
  "reference_id" varchar,  -- 关联 ID（订单号、会话 ID 等）
  "reference_type" varchar,  -- order / session / referral
  "description" varchar,
  "operator_id" uuid REFERENCES "users"("id"),  -- 操作人（管理员调整时）
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX idx_credit_transactions_user_id ON "credit_transactions"("user_id");
CREATE INDEX idx_credit_transactions_created_at ON "credit_transactions"("created_at");
CREATE INDEX idx_credit_transactions_type ON "credit_transactions"("type");
```

### 2.3 spend_logs（消费记录表）

```sql
CREATE TABLE "spend_logs" (
  "id" serial PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "session_id" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
  "model_id" integer REFERENCES "models"("id"),
  "model_name" varchar,  -- 冗余，便于查询
  "provider_id" integer REFERENCES "providers"("id"),
  "prompt_tokens" integer DEFAULT 0,
  "completion_tokens" integer DEFAULT 0,
  "total_tokens" integer DEFAULT 0,
  "input_cost" numeric(12, 2) DEFAULT 0,  -- 输入成本（人民币，元）
  "output_cost" numeric(12, 2) DEFAULT 0,  -- 输出成本（人民币，元）
  "total_cost" numeric(12, 2) DEFAULT 0,  -- 总成本（人民币，元）
  "credits_consumed" integer DEFAULT 0,  -- 消耗积分
  "price_per_credit" numeric(12, 4),  -- 记录当时的积分汇率（便于历史对账）
  "duration_ms" integer,  -- 响应时间（毫秒）
  "status" varchar DEFAULT 'success',  -- success / failed / timeout
  "error_message" text,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX idx_spend_logs_user_id ON "spend_logs"("user_id");
CREATE INDEX idx_spend_logs_workspace_id ON "spend_logs"("workspace_id");
CREATE INDEX idx_spend_logs_created_at ON "spend_logs"("created_at");
CREATE INDEX idx_spend_logs_model_id ON "spend_logs"("model_id");
```

**注意**：
- `price_per_credit` 字段记录消费发生时的积分汇率，便于历史对账（因为汇率可能被管理员调整）
- 积分与人民币的汇率由管理员在"套餐/积分"页面中配置（`credit_configs.pricePerCredit` 字段）
- 第五批已完成汇率配置功能，无需重复开发

### 2.4 content_moderation_logs（内容审核表）

```sql
CREATE TABLE "content_moderation_logs" (
  "id" serial PRIMARY KEY,
  "content_type" varchar NOT NULL,  -- message / agent_description / knowledge_base
  "content_id" varchar NOT NULL,  -- 对应内容的 ID
  "content_preview" text,  -- 内容预览（前 200 字符）
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "risk_level" varchar DEFAULT 'low',  -- low / medium / high / critical
  "flagged_reasons" jsonb,  -- 标记原因数组（如 ["violence", "hate_speech"]）
  "status" varchar DEFAULT 'pending',  -- pending / approved / rejected / appealed
  "moderator_id" uuid REFERENCES "users"("id"),  -- 审核人
  "moderation_note" text,  -- 审核备注
  "moderated_at" timestamp,  -- 审核时间
  "auto_detected" boolean DEFAULT true,  -- 是否自动检测
  "detection_details" jsonb,  -- 检测详情（模型返回）
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX idx_content_moderation_status ON "content_moderation_logs"("status");
CREATE INDEX idx_content_moderation_risk_level ON "content_moderation_logs"("risk_level");
CREATE INDEX idx_content_moderation_created_at ON "content_moderation_logs"("created_at");
```

### 2.5 system_health_checks（系统健康检查表）

```sql
CREATE TABLE "system_health_checks" (
  "id" serial PRIMARY KEY,
  "service_name" varchar NOT NULL,  -- api / model-provider / database / redis / s3
  "endpoint" varchar,  -- 检查的端点
  "status" varchar NOT NULL,  -- healthy / degraded / down
  "response_time_ms" integer,
  "error_rate" numeric(5, 2),  -- 错误率（百分比）
  "uptime_percentage" numeric(5, 2),  -- 可用性百分比（近 24 小时）
  "details" jsonb,  -- 详细信息
  "checked_at" timestamp DEFAULT now()
);
CREATE INDEX idx_system_health_service_name ON "system_health_checks"("service_name");
CREATE INDEX idx_system_health_checked_at ON "system_health_checks"("checked_at");
```

---

## 三、实施阶段

### 阶段一：收入与订阅管理（预计 4 天）

#### 任务 1.1：数据库迁移（0.5 天）

- [ ] 创建 `subscriptions` 表迁移文件
- [ ] 创建 `credit_transactions` 表迁移文件
- [ ] 执行迁移
- [ ] 验证表结构

#### 任务 1.2：后端 API——订阅管理（1.5 天）

**文件**：`packages/business-server/src/lambda-routers/subscriptionRouter.ts`

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `list` | query | 分页查询订阅列表（支持按状态/用户/计划筛选） |
| `getById` | query | 获取订阅详情 |
| `cancel` | mutation | 取消订阅（设置 canceled_at 和 reason） |
| `reactivate` | mutation | 重新激活已取消的订阅 |
| `updatePeriod` | mutation | 延长/缩短订阅周期（管理员操作） |
| `getStats` | query | 订阅统计（活跃数、取消数、MRR 等） |

#### 任务 1.3：后端 API——积分交易（1 天）

**文件**：`packages/business-server/src/lambda-routers/creditTransactionRouter.ts`

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `list` | query | 分页查询交易记录（支持按类型/用户/时间筛选） |
| `getById` | query | 获取交易详情 |
| `adjust` | mutation | 管理员手动调整积分（记录 operator_id） |
| `export` | query | 导出交易记录（CSV/Excel） |
| `getStats` | query | 交易统计（充值总额、消费总额、净增长） |

#### 任务 1.4：前端——收入仪表盘（1 天）

**文件**：`src/features/Admin/RevenueDashboard/`

```
RevenueDashboard/
├── index.tsx                   # 页面入口
├── components/
│   ├── RevenueStats.tsx        # 收入统计卡片（今日/本月/总计）
│   ├── SubscriptionStats.tsx    # 订阅统计卡片（MRR/活跃/取消）
│   ├── RevenueChart.tsx        # 收入趋势图（日/月切换）
│   ├── SubscriptionChart.tsx    # 订阅趋势图（新增/取消）
│   └── RecentTransactions.tsx  # 最近交易列表
└── useRevenueData.ts           # 数据获取 Hook
```

**服务层**：`src/features/Admin/RevenueDashboard/service.ts`

---

### 阶段二：消费与交易管理（预计 4 天）

#### 任务 2.1：数据库迁移（0.5 天）

- [ ] 创建 `spend_logs` 表迁移文件
- [ ] 执行迁移
- [ ] 验证表结构

#### 任务 2.2：后端 API——消费记录（1.5 天）

**文件**：`packages/business-server/src/lambda-routers/spendRouter.ts`

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `list` | query | 分页查询消费记录（支持按用户/模型/时间筛选） |
| `getById` | query | 获取消费详情 |
| `getByUser` | query | 获取指定用户的消费汇总 |
| `getByModel` | query | 获取指定模型的消费汇总 |
| `export` | query | 导出消费记录 |
| `getStats` | query | 消费统计（Token 总量、总成本、按模型分解） |

#### 任务 2.3：后端 API——积分交易前端（1 天）

**文件**：`src/features/Admin/CreditTransactionManagement/`

```
CreditTransactionManagement/
├── index.tsx                   # 页面入口（交易记录列表）
├── components/
│   ├── TransactionTable.tsx    # 交易记录表格
│   ├── TransactionFilter.tsx   # 筛选器（类型/时间/用户）
│   ├── AdjustCreditModal.tsx   # 手动调整积分弹窗
│   └── TransactionStats.tsx    # 交易统计卡片
└── service.ts                  # API 调用
```

#### 任务 2.4：前端——消费记录（1 天）

**文件**：`src/features/Admin/SpendManagement/`

```
SpendManagement/
├── index.tsx                   # 页面入口（消费记录列表）
├── components/
│   ├── SpendTable.tsx         # 消费记录表格
│   ├── SpendFilter.tsx        # 筛选器（用户/模型/时间）
│   ├── SpendStats.tsx         # 消费统计卡片
│   └── SpendChart.tsx         # 消费趋势图
└── service.ts                  # API 调用
```

---

### 阶段三：审核与监控（预计 4 天）

#### 任务 3.1：数据库迁移（0.5 天）

- [ ] 创建 `content_moderation_logs` 表迁移文件
- [ ] 创建 `system_health_checks` 表迁移文件
- [ ] 执行迁移
- [ ] 验证表结构

#### 任务 3.2：后端 API——内容审核（1.5 天）

**文件**：`packages/business-server/src/lambda-routers/contentModerationRouter.ts`

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `list` | query | 分页查询审核记录（支持按状态/风险等级筛选） |
| `getById` | query | 获取审核详情 |
| `approve` | mutation | 审核通过 |
| `reject` | mutation | 审核拒绝（可填写原因） |
| `batchApprove` | mutation | 批量审核通过 |
| `getStats` | query | 审核统计（待审核数、通过率、风险分布） |

#### 任务 3.3：后端 API——系统健康监控（1 天）

**文件**：`packages/business-server/src/lambda-routers/systemHealthRouter.ts`

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `getStatus` | query | 获取所有服务当前健康状态 |
| `getHistory` | query | 获取服务健康历史（图表用） |
| `getMetrics` | query | 获取系统指标（API 响应时间、错误率） |
| `triggerCheck` | mutation | 手动触发健康检查 |

**说明**：系统监控数据可能来自：
- 定时任务写入 `system_health_checks` 表
- 或实时从监控系统的 API 获取（如 Prometheus）

本计划先实现数据库方案，后续可接入外部监控。

#### 任务 3.4：前端——内容审核（1 天）

**文件**：`src/features/Admin/ContentModeration/`

```
ContentModeration/
├── index.tsx                   # 页面入口（审核列表）
├── components/
│   ├── ModerationTable.tsx     # 审核记录表格
│   ├── ModerationFilter.tsx    # 筛选器（状态/风险等级）
│   ├── ContentPreview.tsx      # 内容预览弹窗
│   └── ModerationAction.tsx    # 审核操作（通过/拒绝）
└── service.ts                  # API 调用
```

#### 任务 3.5：前端——系统健康监控（1 天）

**文件**：`src/features/Admin/SystemHealth/`

```
SystemHealth/
├── index.tsx                   # 页面入口（监控仪表盘）
├── components/
│   ├── ServiceStatusCard.tsx   # 服务状态卡片
│   ├── ResponseTimeChart.tsx   # 响应时间图表
│   ├── ErrorRateChart.tsx      # 错误率图表
│   └── UptimeHistory.tsx       # 可用性历史图表
└── service.ts                  # API 调用
```

---

## 四、目录结构总览

```
src/features/Admin/
├── RevenueDashboard/           # 新增：收入仪表盘
│   ├── index.tsx
│   ├── components/
│   │   ├── RevenueStats.tsx
│   │   ├── SubscriptionStats.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── SubscriptionChart.tsx
│   │   └── RecentTransactions.tsx
│   └── service.ts
├── SubscriptionManagement/     # 新增：订阅管理
│   ├── index.tsx
│   ├── components/
│   │   ├── SubscriptionTable.tsx
│   │   ├── SubscriptionFilter.tsx
│   │   ├── SubscriptionDetail.tsx
│   │   └── CancelSubscriptionModal.tsx
│   └── service.ts
├── CreditTransactionManagement/  # 新增：积分交易管理
│   ├── index.tsx
│   ├── components/
│   │   ├── TransactionTable.tsx
│   │   ├── TransactionFilter.tsx
│   │   ├── AdjustCreditModal.tsx
│   │   └── TransactionStats.tsx
│   └── service.ts
├── SpendManagement/            # 新增：消费记录
│   ├── index.tsx
│   ├── components/
│   │   ├── SpendTable.tsx
│   │   ├── SpendFilter.tsx
│   │   ├── SpendStats.tsx
│   │   └── SpendChart.tsx
│   └── service.ts
├── ContentModeration/          # 新增：内容审核
│   ├── index.tsx
│   ├── components/
│   │   ├── ModerationTable.tsx
│   │   ├── ModerationFilter.tsx
│   │   ├── ContentPreview.tsx
│   │   └── ModerationAction.tsx
│   └── service.ts
├── SystemHealth/               # 新增：系统健康监控
│   ├── index.tsx
│   ├── components/
│   │   ├── ServiceStatusCard.tsx
│   │   ├── ResponseTimeChart.tsx
│   │   ├── ErrorRateChart.tsx
│   │   └── UptimeHistory.tsx
│   └── service.ts
└── ...
```

---

## 五、技术路径

### 5.1 后端技术路径

- **框架**：tRPC Lambda Router（与现有管理后台一致）
- **数据库操作**：Drizzle ORM
- **权限校验**：`adminProcedure`（已存在）
- **分页模式**：与现有模块一致（cursor-based 或 offset-based）

### 5.2 前端技术路径

- **框架**：React 19 + TypeScript
- **UI 组件**：`@lobehub/ui` + antd
- **样式**：`createStaticStyles` + `cssVar.*`
- **数据获取**：SWR（`useSWR`）
- **图表**：使用 `@lobehub/ui` 的图表组件或 `recharts`
- **i18n**：`react-i18next`

### 5.3 图表方案

收入仪表盘和消费记录需要图表，推荐方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| `recharts` | 轻量、React 原生、配置简单 | 功能相对较少 |
| `@lobehub/ui` 图表 | 与项目风格一致 | 需要确认是否已支持 |

**建议**：使用 `recharts`（项目已有依赖），或确认 `@lobehub/ui` 的图表能力。

---

## 六、实施注意事项

### 6.1 数据库迁移

- 所有新表需要创建对应的 Drizzle schema 文件
- 迁移文件命名规范：`XXXX_add_<table_name>.ts`
- 执行迁移前需要在开发环境测试
- 需要为外键添加索引（性能考虑）

### 6.2 后端 API

- 所有 Router 需要添加到 `packages/business-server/src/lambda-routers/index.ts` 的导出中
- 需要在 `src/server/routers/admin.ts` 中注册新的 tRPC router
- 分页查询需要使用统一的响应格式（`{ items: [], total: number }`）
- 敏感操作（如积分调整）需要记录操作日志

### 6.3 前端

- 所有新页面需要添加到管理后台路由配置中
- 需要在侧边栏菜单中添加"商业运营"分组
- 列表页面使用 `ActionTable` 组件（统一风格）
- 图表页面需要响应式适配

### 6.4 i18n

需要在以下文件中添加新 key：
- `src/locales/default/admin.ts`（英文源）
- `locales/en-US/admin.ts`（英文镜像）
- `locales/zh-CN/admin.ts`（中文翻译）

### 6.5 测试

- 每个后端 procedure 需要编写单元测试（Vitest）
- 前端组件需要快照测试
- 需要在开发环境手动验证所有 CRUD 操作

---

## 七、风险与依赖

### 7.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据库表结构设计不合理 | 需要后续迁移 | 先与用户确认 PRD 中的表结构 |
| 图表库选择不当 | 需要重写图表代码 | 先确认 `recharts` 是否满足需求 |
| 系统监控数据来源不明确 | 功能无法实现 | 先实现数据库存储方案，后续接入真实数据源 |
| 第三方支付数据集成复杂 | 开发时间超预期 | 本期只做展示，不做支付渠道集成 |

### 7.2 依赖

- 依赖第五批的 `plans` 表（套餐配置）
- 依赖现有的用户/工作区/模型数据
- 依赖 SWR 和 `@lobehub/ui` 的稳定性

---

## 八、完成标准

### 8.1 功能完成标准

- [ ] 所有 CRUD 操作可以正常执行
- [ ] 分页和筛选功能正常工作
- [ ] 图表数据准确显示
- [ ] i18n 中英文切换正常
- [ ] TypeScript 编译 0 错误
- [ ] ESLint 0 错误

### 8.2 代码质量

- [ ] 所有文件符合项目代码规范
- [ ] 没有 `any` 类型
- [ ] 组件拆分合理（单个文件不超过 800 行）
- [ ] 服务层与组件层分离

### 8.3 文档

- [ ] 更新 `lobehub-admin-prd.md`（标记第六批为已完成）
- [ ] 提交 commit message 符合规范（gitmoji）

---

## 九、附录：API 接口设计示例

### 9.1 订阅管理 API

```typescript
// packages/business-server/src/lambda-routers/subscriptionRouter.ts

export const subscriptionRouter = {
  // 获取订阅列表
  list: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.enum(['active', 'canceled', 'expired', 'past_due']).optional(),
      userId: z.string().uuid().optional(),
      planId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      // 实现分页查询
    }),

  // 取消订阅
  cancel: adminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 实现取消逻辑
    }),

  // ... 其他 procedures
};
```

### 9.2 前端服务层示例

```typescript
// src/features/Admin/SubscriptionManagement/service.ts

import { tRPCClient } from '@/services';

export const subscriptionService = {
  list: async (params: ListSubscriptionParams) => {
    return tRPCClient.subscription.list.query(params);
  },

  cancel: async (id: number, reason?: string) => {
    return tRPCClient.subscription.cancel.mutate({ id, reason });
  },

  // ... 其他方法
};
```

---

**文档版本**：v1.0
**最后更新**：2026-03-20
**作者**：AI Assistant
