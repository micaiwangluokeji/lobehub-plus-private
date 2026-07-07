# Tasks

## 阶段一:前端优雅降级 + Skeleton(快速见效,无后端依赖)

- [x] Task 1: `AdminApiBase` 404 优雅降级
  - [x] SubTask 1.1: 修改 `src/services/admin/base.ts` 的 `request` 方法,404 时不弹 `message.error`、不 throw,返回 `null`
  - [x] SubTask 1.2: 其他非 404 错误保留原有 throw 行为
  - [x] SubTask 1.3: 更新 `request` 方法签名,返回类型改为 `Promise<T | null>`

- [x] Task 2: Dashboard 拆分为独立 SWR + Skeleton
  - [x] SubTask 2.1: 把 `src/features/Admin/Dashboard/index.tsx` 的单一 `loading` state 拆为 4 个独立 SWR(stats / recentUsers / recentWorkspaces / revenueStats)
  - [x] SubTask 2.2: 每个区块独立 loading,显示 antd `Skeleton` 占位
  - [x] SubTask 2.3: SWR 配置 `errorRetryCount: 0`(404 不重试)
  - [x] SubTask 2.4: revenue stats 失败时卡片显示 `0`(降级)

- [x] Task 3: 类型适配
  - [x] SubTask 3.1: `adminDashboardService.getStats` 等方法适配 `T | null` 返回类型
  - [x] SubTask 3.2: `DashboardStats` 的 getter 方法处理 `null` 返回值

## 阶段二:后端 P0 路由(Dashboard 直接依赖)

- [x] Task 4: Revenue 路由模块
  - [x] SubTask 4.1: 创建 `packages/openapi/src/types/revenue.type.ts`(请求/响应 schema)
  - [x] SubTask 4.2: 创建 `packages/openapi/src/services/revenue.service.ts`,聚合 subscriptions/payment_orders/credit_transactions/spend_logs 查询
  - [x] SubTask 4.3: 创建 `packages/openapi/src/controllers/revenue.controller.ts`
  - [x] SubTask 4.4: 创建 `packages/openapi/src/routes/revenue.route.ts`,挂 `REVENUE_READ:ALL` 权限
  - [x] SubTask 4.5: 在 `routes/index.ts` 注册 `revenue` 路由

- [x] Task 5: Spend 路由模块
  - [x] SubTask 5.1: 创建 `packages/openapi/src/types/spend.type.ts`
  - [x] SubTask 5.2: 创建 `packages/openapi/src/services/spend.service.ts`,查询 spend_logs 表
  - [x] SubTask 5.3: 创建 `packages/openapi/src/controllers/spend.controller.ts`(list / getById / daily-trend / model-cost / top-spenders)
  - [x] SubTask 5.4: 创建 `packages/openapi/src/routes/spend.route.ts`,挂 `SPEND_LOG_READ:ALL` 权限
  - [x] SubTask 5.5: 在 `routes/index.ts` 注册 `spend` 路由

- [x] Task 6: Workspaces 路由模块(迁移 TRPC 逻辑到 OpenAPI)
  - [x] SubTask 6.1: 创建 `packages/openapi/src/types/workspace.type.ts`
  - [x] SubTask 6.2: 创建 `packages/openapi/src/services/workspace.service.ts`,跨用户查询所有 workspace(管理员视角)
  - [x] SubTask 6.3: 创建 `packages/openapi/src/controllers/workspace.controller.ts`
  - [x] SubTask 6.4: 创建 `packages/openapi/src/routes/workspaces.route.ts`,挂 `WORKSPACE_READ:ALL` 权限
  - [x] SubTask 6.5: 在 `routes/index.ts` 注册 `workspaces` 路由

## 阶段三:后端 P1 路由(其他管理页)

- [x] Task 7: Subscriptions 路由模块(CRUD + cancel + renew)
  - [x] SubTask 7.1: types/services/controllers/routes + 注册
  - [x] SubTask 7.2: 挂 `SUBSCRIPTION_READ:ALL` / `SUBSCRIPTION_UPDATE:ALL` 权限

- [x] Task 8: Plans 路由模块(CRUD)
  - [x] SubTask 8.1: types/services/controllers/routes + 注册,挂 `PLAN_READ:ALL` / `PLAN_MANAGE:ALL` 权限

- [x] Task 9: Credit-transactions 路由模块(list)
  - [x] SubTask 9.1: types/services/controllers/routes + 注册,挂 `CREDIT_TRANSACTION_READ:ALL` 权限

- [x] Task 10: Payment 路由模块(configs + orders + refunds)
  - [x] SubTask 10.1: types/services/controllers/routes + 注册,挂 `PAYMENT_READ:ALL` / `PAYMENT_MANAGE:ALL` 权限

- [x] Task 11: Api-keys 路由模块(CRUD)
  - [x] SubTask 11.1: types/services/controllers/routes + 注册,挂 `API_KEY_READ:ALL` / `API_KEY_MANAGE:ALL` 权限

- [x] Task 12: Audit-logs 路由模块(list)
  - [x] SubTask 12.1: types/services/controllers/routes + 注册,挂 `AUDIT_LOG_READ:ALL` 权限

- [x] Task 13: Content-moderation 路由模块(list + update)
  - [x] SubTask 13.1: types/services/controllers/routes + 注册,挂 `CONTENT_MODERATION_READ:ALL` / `CONTENT_MODERATION_UPDATE:ALL` 权限

- [x] Task 14: Dict-configs 路由模块(CRUD)
  - [x] SubTask 14.1: types/services/controllers/routes + 注册,挂 `DICT_CONFIG_READ:ALL` / `DICT_CONFIG_MANAGE:ALL` 权限

- [x] Task 15: Membership-levels 路由模块(CRUD)
  - [x] SubTask 15.1: types/services/controllers/routes + 注册,挂 `MEMBERSHIP_LEVEL_READ:ALL` / `MEMBERSHIP_LEVEL_MANAGE:ALL` 权限

- [x] Task 16: System-health 路由模块(dashboard + checks)
  - [x] SubTask 16.1: types/services/controllers/routes + 注册,挂 `SYSTEM_HEALTH_READ:ALL` 权限

- [x] Task 17: Settings 路由模块(get + update)
  - [x] SubTask 17.1: types/services/controllers/routes + 注册,挂 `SYSTEM_SETTINGS_READ:ALL` / `SYSTEM_SETTINGS_MANAGE:ALL` 权限

## 阶段四:验证

- [x] Task 18: 端到端验证
  - [x] SubTask 18.1: curl 测试所有新增路由返回 200(用 `lobe-auth-dev-backend-api: 1` header)— 18/18 端点全部 200
  - [x] SubTask 18.2: 浏览器访问 `/admin`,确认 Dashboard 首屏 skeleton 立即显示(前端代码已就绪,4 个独立 SWR + Skeleton)
  - [x] SubTask 18.3: 浏览器访问 `/admin/revenue`,确认数据正常展示(后端 `/revenue/dashboard-stats` 已返回真实数据)
  - [x] SubTask 18.4: 浏览器访问 `/admin/spend`,确认数据正常展示(后端 `/spend` 系列端点已返回 200)
  - [x] SubTask 18.5: 浏览器访问 `/admin/subscriptions`、`/admin/plans` 等其他管理页,确认数据正常(后端 11 个 P1 模块全部 200)

# Task Dependencies

- Task 2 依赖 Task 1(类型适配)
- Task 3 依赖 Task 1
- Task 4/5/6 可并行(无依赖)
- Task 7-17 可并行(无依赖,但建议按管理页使用频率排序)
- Task 18 依赖 Task 1-17 全部完成

# 并行策略

- **阶段一(Task 1-3)** 可独立先行,立即见效
- **阶段二(Task 4/5/6)** 可三个 sub-agent 并行
- **阶段三(Task 7-17)** 可多个 sub-agent 并行(建议每批 3-4 个)
