# LobeHub 管理后台 PRD 文档——第六批（商业运营）

> **版本**：v1.0  
> **状态**：待确认  
> **日期**：2026-07-02  
> **项目**：LobeHub Canary  
> **范围**：第六批管理后台功能扩展——商业运营核心模块  
> **前置条件**：第一～五批已完成（17 个模块）

---

## 一、项目概述

### 1.1 背景

LobeHub 管理后台第一～五批已完成 17 个模块的开发，覆盖了基础管理、资源管理、AI 配置、系统运维和商业配置（支付/套餐）。

**当前核心问题**：

1. **无法运营 SaaS**——没有订阅管理，无法查看谁订阅了什么套餐
2. **财务不透明**——没有收入仪表盘，老板无法实时看到收入
3. **无法对账**——没有积分交易流水，用户充值/消费记录不可查
4. **无法监控成本**——没有 Token 消耗分析，AI 调用成本不可见
5. **合规风险**——没有内容审核，违规内容无法标记和处理
6. **服务可用性未知**——没有系统健康监控，服务挂了无法及时发现

### 1.2 目标

在现有管理后台基础上，新增第六批功能模块，覆盖以下核心场景：

| # | 页面 | 说明 | 优先级 |
|---|------|------|--------|
| 1 | 收入仪表盘 | 实时收入、订阅、用户增长核心指标 | P0 |
| 2 | 订阅管理 | 用户订阅记录查看、取消、历史 | P0 |
| 3 | 积分交易管理 | 充值/消费/退款记录，支持导出对账 | P0 |
| 4 | 消费记录 | Token 消耗明细、按用户/模型维度分析 | P0 |
| 5 | 内容审核 | 消息/Agent 内容标记、审核、封禁 | P0 |
| 6 | 系统健康监控 | API 可用性、响应时间、错误率实时看板 | P0 |

### 1.3 核心原则

1. **后端先行**：第六批功能后端目前为空壳，需先补充后端 API，再开发前端
2. **数据库优先**：需先设计数据库 Schema，执行迁移，再开发
3. **复用现有架构**：沿用 tRPC + Drizzle ORM + AdminApiBase 模式
4. **权限控制**：仅 `super_admin` 可访问商业运营模块
5. **分步实施**：6 个模块分 3 个阶段开发（每阶段 2 个模块）
6. **人民币计价**：全平台统一使用人民币计价，所有成本、价格、交易金额均以人民币（CNY）存储和展示
7. **汇率可配置**：积分与人民币的汇率（`pricePerCredit`）由管理员在"套餐/积分"页面中自由配置，不固定

#### 1.4 货币与积分配置说明

- **计价货币**：人民币（CNY），符号显示为"元"
- **成本精度**：`DECIMAL(12, 2)`，精确到分
- **积分汇率**：`credit_configs.pricePerCredit` 字段，表示 1 积分 = X 元人民币
  - 默认值：`0.01`（即 1 元 = 100 积分）
  - 配置入口：管理后台 → 套餐/积分 → 积分设置 → `pricePerCredit`
  - 已实现：第五批已完成前端 UI 和后端 API
- **积分消费**：用户使用积分支付 AI 调用费用时，按当前 `pricePerCredit` 换算

---

## 二、数据库 Schema 设计

### 2.1 订阅表 (`subscriptions`)

```sql
-- 用户订阅记录
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(64) NOT NULL REFERENCES plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP,
  payment_method VARCHAR(50), -- wechat, alipay, stripe
  last_payment_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

### 2.2 积分交易表 (`credit_transactions`)

```sql
-- 积分交易流水（充值/消费/退款/奖励）
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL, -- top_up, consumption, refund, reward, adjustment
  amount INTEGER NOT NULL, -- 正数为收入，负数为支出
  balance_after INTEGER NOT NULL, -- 交易后余额
  related_id VARCHAR(64), -- 关联 ID（如 message_id, order_id）
  related_type VARCHAR(50), -- 关联类型（如 message, order, referral）
  description TEXT,
  operator_id VARCHAR(64) REFERENCES users(id), -- 操作人（管理员手动调整时有值）
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
```

### 2.3 消费记录表 (`spend_logs`)

```sql
-- AI 调用消费记录
CREATE TABLE spend_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
  session_id VARCHAR(64) REFERENCES sessions(id) ON DELETE SET NULL,
  message_id VARCHAR(64) REFERENCES messages(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL, -- 使用的模型标识
  provider VARCHAR(100) NOT NULL, -- 供应商
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  input_cost DECIMAL(12, 2) DEFAULT 0, -- 输入成本（人民币，元）
  output_cost DECIMAL(12, 2) DEFAULT 0, -- 输出成本（人民币，元）
  total_cost DECIMAL(12, 2) NOT NULL, -- 总成本（人民币，元）
  credits_consumed INTEGER NOT NULL DEFAULT 0, -- 消耗积分
  price_per_credit DECIMAL(12, 4), -- 记录当时的积分汇率（便于历史对账）
  api_duration_ms INTEGER, -- API 调用耗时（毫秒）
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, failed, timeout
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_spend_logs_user_id ON spend_logs(user_id);
CREATE INDEX idx_spend_logs_created_at ON spend_logs(created_at DESC);
CREATE INDEX idx_spend_logs_model ON spend_logs(model);
```

### 2.4 内容审核表 (`content_moderation`)

```sql
-- 内容审核记录
CREATE TABLE content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- message, agent, knowledge_base
  content_id VARCHAR(64) NOT NULL, -- 关联的内容 ID
  content_text TEXT, -- 被标记的内容文本（截断存储）
  reporter_id VARCHAR(64) REFERENCES users(id), -- 举报人（可选）
  moderator_id VARCHAR(64) REFERENCES users(id), -- 审核人
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, removed
  reason VARCHAR(50), -- 违规原因：spam, hate_speech, nsfw, violence, other
  notes TEXT, -- 审核备注
  auto_flagged BOOLEAN NOT NULL DEFAULT false, -- 是否系统自动标记
  flagged_keywords TEXT[], -- 命中的关键词
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_moderation_status ON content_moderation(status);
CREATE INDEX idx_content_moderation_content ON content_moderation(content_type, content_id);
```

### 2.5 系统健康监控表（`system_health_checks`）

```sql
-- 系统健康检查记录（用于监控看板）
CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL, -- 服务名称：api, model.openai, model.anthropic
  endpoint VARCHAR(200), -- 检查的端点
  status VARCHAR(20) NOT NULL, -- healthy, degraded, down
  response_time_ms INTEGER, -- 响应时间（毫秒）
  error_message TEXT,
  uptime_percentage DECIMAL(5, 2), -- 可用性百分比（滚动 24h）
  checked_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_health_checks_service ON system_health_checks(service_name);
CREATE INDEX idx_system_health_checks_checked_at ON system_health_checks(checked_at DESC);
```

---

## 三、后端 API 设计

### 3.1 订阅管理 Router (`subscriptionRouter`)

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `listSubscriptions` | query | 订阅列表（支持按状态/用户/套餐筛选） |
| `getSubscriptionById` | query | 订阅详情 |
| `cancelSubscription` | mutation | 取消订阅（立即或期末） |
| `reactivateSubscription` | mutation | 重新激活已取消的订阅 |
| `getSubscriptionStats` | query | 订阅统计（活跃数、取消率、MRR） |

### 3.2 积分交易 Router (`creditTransactionRouter`)

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `listTransactions` | query | 交易记录列表（支持按类型/用户/时间范围筛选） |
| `getTransactionById` | query | 交易详情 |
| `exportTransactions` | query | 导出交易记录（CSV） |
| `adjustCredits` | mutation | 管理员手动调整用户积分（需填写原因） |
| `getTransactionStats` | query | 交易统计（充值总额、消费总额、净增长） |

### 3.3 消费记录 Router (`spendRouter`)

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `listSpendLogs` | query | 消费记录列表（支持按用户/模型/时间范围筛选） |
| `getSpendStats` | query | 消费统计（总 Token 消耗、总成本、按模型分解） |
| `getUserSpendSummary` | query | 单用户消费汇总 |
| `exportSpendLogs` | query | 导出消费记录（CSV） |

### 3.4 内容审核 Router (`moderationRouter`)

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `listModerationItems` | query | 审核列表（按状态筛选） |
| `getModerationItemById` | query | 审核详情 |
| `approveContent` | mutation | 标记内容合规（通过审核） |
| `rejectContent` | mutation | 标记内容违规（需填写原因） |
| `removeContent` | mutation | 移除违规内容 |
| `flagContent` | mutation | 手动标记内容（管理员主动标记） |

### 3.5 系统健康 Router (`healthRouter`)

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `getHealthOverview` | query | 系统健康总览（所有服务状态） |
| `getServiceHistory` | query | 单个服务的健康历史（24h 曲线） |
| `getApiStats` | query | API 统计（请求量、成功率、P95 响应时间） |
| `getModelHealth` | query | 各 AI 模型健康状态（可用性、平均响应时间） |

### 3.6 收入仪表盘 Router（`revenueRouter`）

| Procedure | 类型 | 说明 |
|-----------|------|------|
| `getRevenueStats` | query | 收入统计（今日/本月/本年，环比增长） |
| `getSubscriptionMetrics` | query | 订阅指标（MRR、活跃订阅数、取消率、转化率） |
| `getRevenueChart` | query | 收入趋势图数据（按日/月聚合） |
| `getTopSpenders` | query | 消费 Top 用户 |
| `getTopModelsByCost` | query | 成本最高的模型排行 |

---

## 四、页面详细设计

### 4.1 收入仪表盘 `/admin/revenue`

**功能说明**：商业运营核心看板，展示收入、订阅、用户增长等关键指标。

**数据来源**：

| 数据项 | API | 说明 |
|--------|-----|------|
| 今日收入 | `revenueRouter.getRevenueStats` | 今日充值总额 |
| 本月收入 | `revenueRouter.getRevenueStats` | 本月收入（订阅 + 充值） |
| 活跃订阅数 | `revenueRouter.getSubscriptionMetrics` | 当前活跃订阅总数 |
| MRR | `revenueRouter.getSubscriptionMetrics` | 月度经常性收入 |
| 取消率 | `revenueRouter.getSubscriptionMetrics` | 本月订阅取消率 |
| 收入趋势图 | `revenueRouter.getRevenueChart` | 近 30 天收入曲线 |
| 消费 Top 用户 | `revenueRouter.getTopSpenders` | 积分消耗最多的用户 |
| 成本最高模型 | `revenueRouter.getTopModelsByCost` | AI 调用成本最高的模型 |

**UI 方案**：

```
┌─────────────────────────────────────────────────────────────┐
│  收入仪表盘                                               │
├─────────────────────────────────────────────────────────────┤
│  [今日收入] [本月收入] [活跃订阅] [MRR] [取消率]         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ ¥12,580  │ │ ¥358,200│ │ 1,247    │ │ ¥89,550 │  │
│  │ ↑ 12.3%  │ │ ↑ 8.7%  │ │ ↑ 45     │ │ ↓ 2.1%  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  收入趋势（近30天）  │  │  新增订阅趋势        │      │
│  │  (Line Chart)       │  │  (Bar Chart)        │      │
│  └─────────────────────┘  └─────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  消费 Top 用户       │  │  成本最高模型        │      │
│  │  (Table)           │  │  (Bar Chart)        │      │
│  └─────────────────────┘  └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**开发量**：2 天

---

### 4.2 订阅管理 `/admin/subscriptions`

**功能说明**：查看和管理所有用户的订阅记录。

**数据来源**：

| 操作 | API | 说明 |
|------|-----|------|
| 订阅列表 | `subscriptionRouter.listSubscriptions` | 支持筛选和分页 |
| 订阅详情 | `subscriptionRouter.getSubscriptionById` | 完整订阅信息 |
| 取消订阅 | `subscriptionRouter.cancelSubscription` | 支持立即取消或期末取消 |
| 重新激活 | `subscriptionRouter.reactivateSubscription` | 重新激活已取消的订阅 |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 用户 | `userId` | Avatar + 用户名 | 可点击查看用户详情 |
| 套餐 | `planId` | Tag | 套餐名称 |
| 状态 | `status` | Tag（颜色编码） | active=绿色, cancelled=红色, expired=灰色 |
| 计费周期 | `billingCycle` | 文本 | 月付/年付 |
| 当前周期 | `currentPeriodStart` ~ `currentPeriodEnd` | 日期范围 | — |
| 自动续费 | `cancelAtPeriodEnd` | Switch/Tag | 是否已关闭自动续费 |
| 支付方式 | `paymentMethod` | Tag | 微信/支付宝/Stripe |
| 最后支付 | `lastPaymentAt` | 相对时间 | — |
| 操作 | — | 按钮组 | 详情、取消订阅、重新激活 |

**UI 方案**：

- 顶部：状态筛选（Select）+ 套餐筛选 + 搜索栏 + 时间范围选择
- 主体：antd Table
- 详情：Drawer 展示完整订阅信息 + 关联交易记录
- 取消订阅：Modal 确认（选择"立即取消"或"期末取消"）

**开发量**：1.5 天

---

### 4.3 积分交易管理 `/admin/credits`

**功能说明**：查看和管理所有积分交易记录，支持对账导出。

**数据来源**：

| 操作 | API | 说明 |
|------|-----|------|
| 交易列表 | `creditTransactionRouter.listTransactions` | 支持按类型/用户/时间范围筛选 |
| 交易详情 | `creditTransactionRouter.getTransactionById` | 完整交易信息 |
| 手动调整 | `creditTransactionRouter.adjustCredits` | 管理员手动调整用户积分 |
| 导出记录 | `creditTransactionRouter.exportTransactions` | 导出 CSV |
| 交易统计 | `creditTransactionRouter.getTransactionStats` | 充值总额、消费总额、净增长 |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 时间 | `createdAt` | 格式化时间 | — |
| 用户 | `userId` | Avatar + 用户名 | 可点击查看用户详情 |
| 类型 | `type` | Tag（颜色编码） | top_up=绿色, consumption=蓝色, refund=橙色, reward=金色, adjustment=灰色 |
| 变动金额 | `amount` | 文本（颜色） | 正数绿色，负数红色 |
| 余额 | `balanceAfter` | 数字 | 交易后余额 |
| 关联内容 | `relatedType` + `relatedId` | 链接 | 可跳转到关联内容 |
| 说明 | `description` | 文本 + Tooltip | — |
| 操作人 | `operatorId` | 用户名 | 手动调整时有值 |

**UI 方案**：

- 顶部：类型筛选 + 用户搜索 + 时间范围选择 + "导出"按钮 + "手动调整"按钮
- 主体：antd Table
- 手动调整：Modal + Form（选择用户、调整金额、调整原因）
- 导出：触发下载 CSV 文件

**开发量**：1.5 天

---

### 4.4 消费记录 `/admin/spend`

**功能说明**：查看 AI 调用消费记录，按用户/模型维度分析。

**数据来源**：

| 操作 | API | 说明 |
|------|-----|------|
| 消费列表 | `spendRouter.listSpendLogs` | 支持按用户/模型/时间范围筛选 |
| 消费统计 | `spendRouter.getSpendStats` | 总 Token 消耗、总成本、按模型分解 |
| 用户消费汇总 | `spendRouter.getUserSpendSummary` | 单用户的消费统计 |
| 导出记录 | `spendRouter.exportSpendLogs` | 导出 CSV |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 时间 | `createdAt` | 相对时间 | — |
| 用户 | `userId` | Avatar + 用户名 | 可点击查看用户详情 |
| 模型 | `model` | Tag | 模型标识 |
| 供应商 | `provider` | Tag | 供应商名称 |
| 输入 Token | `inputTokens` | 数字（格式化） | 如 1,024 |
| 输出 Token | `outputTokens` | 数字（格式化） | 如 512 |
| 总成本 | `totalCost` | 货币文本 | $0.0045 |
| 消耗积分 | `creditsConsumed` | 数字 | — |
| 响应时间 | `apiDurationMs` | 数字 + 颜色 | >3000ms 红色 |
| 状态 | `status` | Tag | success=绿色, failed=红色 |

**UI 方案**：

- 顶部：用户搜索 + 模型筛选 + 供应商筛选 + 时间范围选择 + "导出"按钮
- 主体：antd Table
- 统计面板（顶部）：总调用次数、总 Token 消耗、总成本、平均成本/千 Token
- 可视化（可选）：按模型成本分布饼图、按日消费趋势折线图

**开发量**：1.5 天

---

### 4.5 内容审核 `/admin/moderation`

**功能说明**：标记、审核和处理违规内容（消息/Agent/知识库）。

**数据来源**：

| 操作 | API | 说明 |
|------|-----|------|
| 审核列表 | `moderationRouter.listModerationItems` | 按状态筛选 |
| 审核详情 | `moderationRouter.getModerationItemById` | 完整审核信息 |
| 通过审核 | `moderationRouter.approveContent` | 标记内容合规 |
| 拒绝/封禁 | `moderationRouter.rejectContent` | 标记内容违规 |
| 移除内容 | `moderationRouter.removeContent` | 删除违规内容 |
| 手动标记 | `moderationRouter.flagContent` | 管理员主动标记 |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 时间 | `createdAt` | 相对时间 | — |
| 内容类型 | `contentType` | Tag | message=蓝色, agent=绿色, knowledge_base=橙色 |
| 内容预览 | `contentText` | 文本 + Tooltip | 截断显示前 100 字符 |
| 举报人 | `reporterId` | 用户名 | 系统自动标记时为"系统" |
| 状态 | `status` | Tag（颜色编码） | pending=黄色, approved=绿色, rejected=红色, removed=灰色 |
| 违规原因 | `reason` | Tag | spam, hate_speech, nsfw 等 |
| 自动标记 | `autoFlagged` | Badge | 系统自动标记的显示"AI" |
| 审核人 | `moderatorId` | 用户名 | 未审核时为空 |
| 操作 | — | 按钮组 | 查看内容、通过、拒绝、移除 |

**UI 方案**：

- 顶部：状态筛选 + 内容类型筛选 + 搜索栏
- 主体：antd Table
- 查看内容：Drawer 展示完整内容 + 上下文（如消息所在的会话）
- 审核操作：按钮组，点击后弹出确认 Modal（需填写审核备注）
- 批量操作：批量通过、批量拒绝

**开发量**：1.5 天

---

### 4.6 系统健康监控 `/admin/health`

**功能说明**：实时监控系统各服务的健康状态、API 性能和 AI 模型可用性。

**数据来源**：

| 数据项 | API | 说明 |
|--------|-----|------|
| 健康总览 | `healthRouter.getHealthOverview` | 所有服务状态一览 |
| 服务历史 | `healthRouter.getServiceHistory` | 单个服务 24h 健康曲线 |
| API 统计 | `healthRouter.getApiStats` | 请求量、成功率、P95 响应时间 |
| 模型健康 | `healthRouter.getModelHealth` | 各 AI 模型状态和响应时间 |

**UI 方案**：

```
┌─────────────────────────────────────────────────────────────┐
│  系统健康监控                                             │
├─────────────────────────────────────────────────────────────┤
│  服务状态总览                                             │
│  [API 服务] [OpenAI] [Anthropic] [Claude] [Gemini]      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  ● 健康   │ │  ● 健康   │ │  ⚠ 降级  │ │  ● 健康   │  │
│  │ 99.97%   │ │ 99.95%   │ │ 85.2%    │ │ 99.98%   │  │
│  │ 45ms     │ │ 1200ms   │ │ 3200ms   │ │ 980ms    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  API 请求量（24h）  │  │  成功率（24h）      │      │
│  │  (Area Chart)      │  │  (Line Chart)      │      │
│  └─────────────────────┘  └─────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  模型响应时间排行    │  │  最近错误日志        │      │
│  │  (Table)           │  │  (List)            │      │
│  └─────────────────────┘  └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**开发量**：2 天

---

## 五、路由与目录结构

### 5.1 路由配置（追加到现有 `/admin/*` 路由树）

```typescript
// src/spa/router/desktopRouter.config.tsx
// 在现有 admin children 中追加：

{ path: 'revenue', element: <AdminRevenue /> },
{ path: 'subscriptions', element: <AdminSubscriptions /> },
{ path: 'credits', element: <AdminCredits /> },
{ path: 'spend', element: <AdminSpend /> },
{ path: 'moderation', element: <AdminModeration /> },
{ path: 'health', element: <AdminHealth /> },
```

### 5.2 完整目录结构

```
src/
├── routes/(main)/admin/
│   ├── revenue/
│   │   └── index.tsx              # 收入仪表盘页面
│   ├── subscriptions/
│   │   └── index.tsx              # 订阅管理页面
│   ├── credits/
│   │   └── index.tsx              # 积分交易管理页面
│   ├── spend/
│   │   └── index.tsx              # 消费记录页面
│   ├── moderation/
│   │   └── index.tsx              # 内容审核页面
│   └── health/
│       └── index.tsx              # 系统健康监控页面
│
├── features/Admin/
│   ├── Revenue/                    # 收入仪表盘
│   │   ├── RevenueStats.tsx       # 统计卡片
│   │   ├── RevenueChart.tsx       # 收入趋势图
│   │   ├── TopSpenders.tsx       # 消费 Top 用户
│   │   ├── TopModelsByCost.tsx   # 成本最高模型
│   │   └── index.tsx
│   ├── Subscriptions/              # 订阅管理
│   │   ├── SubscriptionList.tsx   # 订阅列表
│   │   ├── SubscriptionDetail.tsx # 订阅详情
│   │   └── index.tsx
│   ├── Credits/                    # 积分交易管理
│   │   ├── CreditTransactionList.tsx  # 交易记录列表
│   │   ├── CreditAdjustModal.tsx  # 手动调整 Modal
│   │   └── index.tsx
│   ├── Spend/                      # 消费记录
│   │   ├── SpendLogList.tsx       # 消费记录列表
│   │   ├── SpendStats.tsx         # 消费统计面板
│   │   └── index.tsx
│   ├── Moderation/                 # 内容审核
│   │   ├── ModerationList.tsx     # 审核列表
│   │   ├── ModerationDetail.tsx   # 审核详情
│   │   └── index.tsx
│   └── Health/                     # 系统健康监控
│       ├── ServiceStatusCards.tsx  # 服务状态卡片
│       ├── ApiStatsChart.tsx       # API 统计图表
│       ├── ModelHealthTable.tsx    # 模型健康表格
│       └── index.tsx
│
├── services/admin/
│   ├── revenue.ts                 # 收入仪表盘 API
│   ├── subscriptions.ts            # 订阅管理 API
│   ├── credits.ts                 # 积分交易 API
│   ├── spend.ts                   # 消费记录 API
│   ├── moderation.ts              # 内容审核 API
│   └── health.ts                  # 系统健康 API
│
└── locales/default/
    └── admin.ts                   # 追加第六批 i18n key
```

### 5.3 侧边栏导航更新

在现有侧边栏中追加"商业运营"分组：

```typescript
const adminNavItems = [
  // ... 现有菜单项 ...
  { type: 'divider' },
  { group: '商业运营' },
  { path: '/admin/revenue', icon: DollarSign, label: '收入仪表盘' },
  { path: '/admin/subscriptions', icon: CreditCard, label: '订阅管理' },
  { path: '/admin/credits', icon: Coins, label: '积分交易' },
  { path: '/admin/spend', icon: TrendingUp, label: '消费记录' },
  { path: '/admin/moderation', icon: ShieldCheck, label: '内容审核' },
  { path: '/admin/health', icon: Activity, label: '系统监控' },
];
```

---

## 六、开发计划

### 第一阶段（P0 核心——收入与订阅）— 4 天

| 序号 | 任务 | 工作量 | 说明 |
|------|------|--------|------|
| 1 | 数据库迁移（subscriptions 表） | 0.5 天 | Schema + Migration |
| 2 | subscriptionRouter 后端实现 | 1 天 | 6 个 procedures |
| 3 | 收入仪表盘前端 | 1.5 天 | 统计卡片 + 图表 + 列表 |
| 4 | 订阅管理前端 | 1 天 | 列表 + 详情 + 取消/激活 |

### 第二阶段（P0 核心——交易与消费）— 4 天

| 序号 | 任务 | 工作量 | 说明 |
|------|------|--------|------|
| 5 | 数据库迁移（credit_transactions + spend_logs 表） | 0.5 天 | Schema + Migration |
| 6 | creditTransactionRouter + spendRouter 后端实现 | 1.5 天 | 共 10 个 procedures |
| 7 | 积分交易管理前端 | 1 天 | 列表 + 手动调整 + 导出 |
| 8 | 消费记录前端 | 1 天 | 列表 + 统计面板 + 导出 |

### 第三阶段（P0 核心——审核与监控）— 4 天

| 序号 | 任务 | 工作量 | 说明 |
|------|------|--------|------|
| 9 | 数据库迁移（content_moderation + system_health_checks 表） | 0.5 天 | Schema + Migration |
| 10 | moderationRouter + healthRouter 后端实现 | 1.5 天 | 共 10 个 procedures |
| 11 | 内容审核前端 | 1 天 | 列表 + 审核流程 |
| 12 | 系统健康监控前端 | 1 天 | 状态卡片 + 图表 |

---

## 七、风险与注意事项

### 7.1 后端开发量大

第六批 6 个模块需要新增 **5 张数据库表** 和 **约 30 个 tRPC procedures**。

**建议**：后端开发可与前端并行，先完成后端 API，再对接前端。

### 7.2 实时数据性能

系统健康监控需要**实时数据**，建议：

- 使用 Redis 缓存健康检查结果（TTL 30s）
- 前端使用 SWR 自动轮询（interval: 30000）
- 考虑 WebSocket 推送关键指标（未来优化）

### 7.3 数据量估算

| 表 | 预估日增量 | 保留策略 |
|----|-----------|---------|
| `credit_transactions` | 1 万条 | 永久保留（财务对账需要） |
| `spend_logs` | 10 万条 | 保留 1 年，历史聚合存储 |
| `content_moderation` | 100 条 | 永久保留 |
| `system_health_checks` | 1440 条（每分钟 1 条） | 保留 30 天 |

**建议**：`spend_logs` 表需要分区或定期归档，避免性能问题。

### 7.4 内容审核的自动化

当前设计支持**手动审核**，未来可集成：

- OpenAI Moderation API（自动检测违规内容）
- 关键词过滤（正则表达式匹配）
- 用户举报流程（前端增加"举报"按钮）

---

## 八、实施步骤

### Step 1：数据库 Schema 设计与迁移（1.5 天）

1. 创建 `packages/database/src/schemas/subscriptions.ts`
2. 创建 `packages/database/src/schemas/credit-transactions.ts`
3. 创建 `packages/database/src/schemas/spend-logs.ts`
4. 创建 `packages/database/src/schemas/content-moderation.ts`
5. 创建 `packages/database/src/schemas/system-health-checks.ts`
6. 生成并运行数据库迁移

### Step 2：后端 Router 实现（4 天）

按第一阶段 → 第二阶段 → 第三阶段顺序，逐个实现 Router：

1. `subscriptionRouter`（6 procedures）
2. `revenueRouter`（5 procedures）
3. `creditTransactionRouter`（5 procedures）
4. `spendRouter`（4 procedures）
5. `moderationRouter`（6 procedures）
6. `healthRouter`（4 procedures）

### Step 3：前端服务层（1 天）

创建 `src/services/admin/` 下新增的 6 个服务文件，封装 tRPC 调用。

### Step 4：前端页面开发（6 天）

按第一阶段 → 第二阶段 → 第三阶段顺序，逐个实现前端页面。

### Step 5：国际化 + 优化（0.5 天）

1. 完善 `admin.ts` 语言文件（中英文双份）
2. TypeScript 编译检查
3. 功能测试
4. 性能优化（分页、虚拟滚动等）

---

## 九、验收标准

| 模块 | 验收标准 |
|------|---------|
| 收入仪表盘 | 统计卡片数据准确，图表展示正常，时间范围筛选可用 |
| 订阅管理 | 列表筛选正常，详情展示完整，取消/激活操作成功 |
| 积分交易 | 列表筛选正常，手动调整成功，导出 CSV 格式正确 |
| 消费记录 | 列表筛选正常，统计面板数据准确，导出功能可用 |
| 内容审核 | 列表展示正常，审核流程完整，内容查看/移除成功 |
| 系统监控 | 服务状态实时更新，图表展示 24h 历史，数据准确 |

---

## 十、未来扩展（P1/P2 功能预告）

以下功能不在第六批范围内，但建议在后续批次中补充：

| 功能 | 说明 | 批次建议 |
|------|------|---------|
| **退款管理** | 退款申请审批、退款记录查询 | 第七批 |
| **优惠码管理** | 创建折扣码、促销活动配置 | 第七批 |
| **推荐奖励管理** | 推荐关系链、奖励发放记录 | 第七批 |
| **用户行为分析** | DAU/MAU 趋势、留存率曲线 | 第八批 |
| **功能开关** | Feature Flag 管理、灰度发布控制 | 第八批 |
| **IP 黑名单** | 封禁恶意 IP、限流配置 | 第八批 |
| **邮件/通知管理** | 全站公告、邮件模板配置 | 第九批 |

---

## 附录 A：API 响应示例

### A.1 订阅列表响应示例

```json
{
  "data": [
    {
      "id": "sub_01HXYZ...",
      "userId": "user_01H...",
      "userName": "张三",
      "userEmail": "zhangsan@example.com",
      "planId": "plan_pro",
      "planName": "专业版",
      "status": "active",
      "billingCycle": "monthly",
      "currentPeriodStart": "2026-07-01T00:00:00Z",
      "currentPeriodEnd": "2026-08-01T00:00:00Z",
      "cancelAtPeriodEnd": false,
      "paymentMethod": "wechat",
      "lastPaymentAt": "2026-07-01T00:05:23Z",
      "createdAt": "2026-06-01T00:00:00Z"
    }
  ],
  "total": 1247,
  "page": 1,
  "pageSize": 20
}
```

### A.2 积分交易记录响应示例

```json
{
  "data": [
    {
      "id": "ctxn_01HXYZ...",
      "userId": "user_01H...",
      "userName": "张三",
      "type": "top_up",
      "amount": 10000,
      "balanceAfter": 15000,
      "relatedId": "order_01H...",
      "relatedType": "order",
      "description": "微信支付充值 ¥100.00",
      "operatorId": null,
      "createdAt": "2026-07-02T10:30:00Z"
    }
  ],
  "total": 54320,
  "page": 1,
  "pageSize": 20,
  "stats": {
    "totalTopUp": 1250000,
    "totalConsumption": 890000,
    "netGrowth": 360000
  }
}
```

### A.3 消费记录响应示例

```json
{
  "data": [
    {
      "id": "spend_01HXYZ...",
      "userId": "user_01H...",
      "userName": "张三",
      "model": "gpt-4o",
      "provider": "openai",
      "inputTokens": 1024,
      "outputTokens": 512,
      "totalTokens": 1536,
      "inputCost": 0.00256,
      "outputCost": 0.01024,
      "totalCost": 0.0128,
      "creditsConsumed": 128,
      "apiDurationMs": 2450,
      "status": "success",
      "createdAt": "2026-07-02T10:30:00Z"
    }
  ],
  "total": 1250000,
  "page": 1,
  "pageSize": 20,
  "stats": {
    "totalTokens": 1250000000,
    "totalCost": 12580.50,
    "avgCostPer1kTokens": 0.0101
  }
}
```

---

> **文档状态**：待产品负责人确认  
> **下一步**：确认 PRD → 编写后端 Schema/Migration → 实现后端 Router → 开发前端 UI
