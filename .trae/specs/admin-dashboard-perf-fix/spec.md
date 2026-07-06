# Admin Dashboard 性能优化与后端 API 实现 Spec

## Why

访问 `/admin` 时加载非常慢(6-10s),根因有三:
1. **后端 API 大面积 404**:前端 admin service 调用的 13+ 个路由(revenue/spend/subscriptions/plans/payment/credit-transactions/api-keys/audit-logs/content-moderation/dict-configs/membership-levels/system-health/workspaces)在后端 OpenAPI 包中不存在,全部返回 404
2. **404 触发 SWR 重试**:`AdminApiBase.request` 在 404 时弹错误提示 + throw,SWR 自动重试,拖长 networkidle
3. **Dashboard 阻塞渲染**:Dashboard 用单个 `loading` state 等待所有 API 返回才渲染,首屏白屏时间长

数据库层(schema + model)**全部已就绪**,后端只缺 controller + service + route + type 层。

## What Changes

### 前端改动(快速见效)

- **`AdminApiBase` 优雅降级**:404 时不弹错误提示、不 throw,返回 `null` 让上层处理
- **Dashboard skeleton 化**:拆分单一 `loading` 为多个独立 SWR,每个区块独立 skeleton
- **SWR 重试策略**:404 不重试,减少无效等待

### 后端改动(数据基础已就绪)

在 `packages/openapi/src/` 新增以下路由模块(优先级按 Dashboard 依赖排序):

**P0 - Dashboard 直接依赖(Dashboard 首屏必需)**:
- `revenue` 路由:`/revenue/dashboard-stats`、`/revenue/subscription-analytics`、`/revenue/credit-analytics`、`/revenue/spend-stats`
- `spend` 路由:`/spend`(list)、`/spend/:id`、`/spend/daily-trend`、`/spend/model-cost`、`/spend/top-spenders`
- `workspaces` 路由:CRUD + members(迁移现有 TRPC workspace.list 逻辑到 OpenAPI,统一管理)

**P1 - 其他管理页依赖**:
- `subscriptions` 路由:CRUD + cancel + renew
- `plans` 路由:CRUD
- `credit-transactions` 路由:list
- `payment` 路由:configs + orders + refunds
- `api-keys` 路由:CRUD
- `audit-logs` 路由:list(workspace_audit_logs)
- `content-moderation` 路由:list + update
- `dict-configs` 路由:CRUD
- `membership-levels` 路由:CRUD
- `system-health` 路由:dashboard + checks
- `settings` 路由:get + update

## Impact

- **Affected code**:
  - 前端:`src/services/admin/base.ts`、`src/features/Admin/Dashboard/index.tsx`、`src/features/Admin/Dashboard/*`
  - 后端:`packages/openapi/src/routes/*`、`packages/openapi/src/controllers/*`、`packages/openapi/src/services/*`、`packages/openapi/src/types/*`、`packages/openapi/src/routes/index.ts`
- **数据库**:无 schema 改动(表和 model 已存在)
- **权限**:新增路由需挂 `requireAnyPermission` 中间件,复用现有 RBAC 权限码
- **BREAKING**:无(纯增量,前端调用路径不变)

## ADDED Requirements

### Requirement: AdminApiBase 优雅降级

系统 SHALL 在 admin API 返回 404 时,不弹出错误提示、不抛出异常,而是返回 `null` 让上层组件显示空状态。

#### Scenario: 404 降级
- **WHEN** admin service 调用返回 404
- **THEN** `AdminApiBase.request` 返回 `null`(而非 throw)
- **AND** 不调用 `message.error()`
- **AND** 上层组件收到 `null` 显示空状态或 skeleton

#### Scenario: 其他错误仍抛出
- **WHEN** admin service 调用返回 500 或其他非 404 错误
- **THEN** 保留原有行为(弹错误提示 + throw)

### Requirement: Dashboard Skeleton 化

系统 SHALL 把 Dashboard 的单一 `loading` 拆分为多个独立的 SWR 请求,每个区块(stats cards / recent users / recent workspaces / revenue stats)独立管理 loading 状态,独立显示 skeleton。

#### Scenario: 首屏渲染
- **WHEN** 用户进入 `/admin`
- **THEN** 立即渲染页面骨架(标题 + 10 个 skeleton 卡片 + 2 个 skeleton 列表)
- **AND** 每个 SWR 请求独立完成后填充对应区块
- **AND** 不再等待所有请求完成才渲染

#### Scenario: 部分 API 失败
- **WHEN** revenue API 404 但 users API 成功
- **THEN** revenue 卡片显示 `0`
- **AND** users 卡片显示真实数据
- **AND** 不阻塞其他区块渲染

### Requirement: SWR 重试策略

系统 SHALL 对 404 响应不重试,只对网络错误或 5xx 重试。

#### Scenario: 404 不重试
- **WHEN** SWR fetcher 收到 404
- **THEN** 不触发重试
- **AND** `data` 为 `null`,`error` 为 `null`

### Requirement: Revenue 路由

系统 SHALL 在 OpenAPI 后端提供 `/api/v1/revenue/*` 路由,聚合 subscriptions/payment_orders/credit_transactions/spend_logs 表数据返回 Dashboard 统计。

#### Scenario: 获取 dashboard stats
- **WHEN** GET `/api/v1/revenue/dashboard-stats?startDate=&endDate=`
- **THEN** 返回 `{ totalRevenue, activeSubscriptionsCount, totalCreditsSold, totalSpendCost, totalTokensUsed }`
- **AND** 需 `REVENUE_READ:ALL` 权限

### Requirement: Spend 路由

系统 SHALL 在 OpenAPI 后端提供 `/api/v1/spend/*` 路由,查询 spend_logs 表。

#### Scenario: 获取 spend 列表
- **WHEN** GET `/api/v1/spend?page=1&pageSize=10&userId=`
- **THEN** 返回分页 spend_logs 数据
- **AND** 需 `SPEND_LOG_READ:ALL` 权限

#### Scenario: 获取每日成本趋势
- **WHEN** GET `/api/v1/spend/daily-trend?days=30`
- **THEN** 返回 `[{ date, totalCost, totalTokens, callCount }]`

### Requirement: Workspaces 路由

系统 SHALL 在 OpenAPI 后端提供 `/api/v1/workspaces/*` 路由(迁移 TRPC 逻辑)。

#### Scenario: 获取 workspace 列表
- **WHEN** GET `/api/v1/workspaces`
- **THEN** 返回所有 workspace(管理员视角,跨用户)
- **AND** 需 `WORKSPACE_READ:ALL` 权限

### Requirement: Subscriptions/Plans/Credit/Payment 路由

系统 SHALL 在 OpenAPI 后端为以下资源提供标准 CRUD 路由:
- `/api/v1/subscriptions` (CRUD + cancel + renew)
- `/api/v1/plans` (CRUD)
- `/api/v1/credit-transactions` (list)
- `/api/v1/payment/configs` + `/api/v1/payment/orders` + `/api/v1/payment/refunds`
- `/api/v1/api-keys` (CRUD)
- `/api/v1/audit-logs` (list)
- `/api/v1/content-moderation` (list + update)
- `/api/v1/dict-configs` (CRUD)
- `/api/v1/membership-levels` (CRUD)
- `/api/v1/system-health` (dashboard + checks)
- `/api/v1/settings` (get + update)

#### Scenario: 标准列表查询
- **WHEN** GET `/api/v1/<resource>?page=1&pageSize=10`
- **THEN** 返回 `{ data: [], total, page, pageSize }`
- **AND** 需对应 `*_READ:ALL` 权限

## MODIFIED Requirements

### Requirement: Admin Dashboard 加载体验

[原] Dashboard 用单一 `loading` state,`Promise.all` 等待 3 个聚合请求完成后渲染。

[新] Dashboard 立即渲染 skeleton,每个区块独立 SWR 请求,独立 loading 状态,独立错误降级。

## REMOVED Requirements

无。
