# 第六批（商业运营）阶段二和阶段三执行计划

## 概述
完成第六批（商业运营）的阶段二（消费与交易管理页面）和阶段三（审核与监控），包括订阅管理/积分交易/消费记录页面，以及内容审核和系统健康监控功能。

## 阶段二：消费与交易管理（预计 2 天）

### 任务 1：订阅管理页面（/admin/subscriptions）
**文件列表：**
- `src/features/Admin/Subscriptions/SubscriptionList.tsx` - 订阅列表页面
- `src/routes/(main)/admin/subscriptions/index.tsx` - 路由文件
- `src/services/admin/subscriptions.ts` - 前端服务（已创建）

**功能：**
- [ ] 订阅列表（表格）
- [ ] 筛选（用户、状态、套餐）
- [ ] 创建订阅（弹窗表单）
- [ ] 编辑订阅（弹窗表单）
- [ ] 取消订阅（确认弹窗）
- [ ] 续订订阅

### 任务 2：积分交易管理页面（/admin/credit-transactions）
**文件列表：**
- `src/features/Admin/CreditTransactions/CreditTransactionList.tsx` - 积分交易列表页面
- `src/routes/(main)/admin/credit-transactions/index.tsx` - 路由文件
- `src/services/admin/credit-transactions.ts` - 前端服务（已创建）

**功能：**
- [ ] 积分交易列表（表格）
- [ ] 筛选（用户、类型、时间范围）
- [ ] 调整用户积分（弹窗表单）
- [ ] 导出交易记录

### 任务 3：消费记录页面（/admin/spend）
**文件列表：**
- `src/features/Admin/Spend/SpendList.tsx` - 消费记录列表页面
- `src/routes/(main)/admin/spend/index.tsx` - 路由文件
- `src/services/admin/spend.ts` - 前端服务（已创建）

**功能：**
- [ ] 消费记录列表（表格）
- [ ] 筛选（用户、模型、时间范围）
- [ ] 消费统计（按用户、按模型）
- [ ] 导出消费记录

## 阶段三：审核与监控（预计 2 天）

### 任务 1：数据库迁移
**文件列表：**
- `packages/database/src/schemas/contentModerationLogs.ts` - 内容审核日志表
- `packages/database/src/schemas/systemHealthChecks.ts` - 系统健康检查表
- `drizzle/migrations/` - 迁移文件

**字段设计：**
- `content_moderation_logs`：id, userId, contentType, contentId, moderationResult, riskScore, flaggedTags, reviewedBy, reviewedAt, status, createdAt, updatedAt
- `system_health_checks`：id, serviceName, status, responseTime, errorMessage, checkedAt, createdAt, updatedAt

### 任务 2：后端 API（内容审核）
**文件列表：**
- `packages/business-server/src/lambda-routers/contentModeration.ts` - 内容审核 router
- `packages/database/src/models/contentModerationLogs.ts` - 内容审核日志模型

**Procedures：**
- [ ] list（分页、筛选）
- [ ] getById
- [ ] create（创建审核记录）
- [ ] updateStatus（更新审核状态）
- [ ] getModerationStats（审核统计）

### 任务 3：后端 API（系统健康监控）
**文件列表：**
- `packages/business-server/src/lambda-routers/systemHealth.ts` - 系统健康 router
- `packages/database/src/models/systemHealthChecks.ts` - 系统健康检查模型

**Procedures：**
- [ ] list（分页、筛选）
- [ ] getById
- [ ] create（创建健康检查记录）
- [ ] getHealthStatus（获取系统健康状态）
- [ ] getServiceStats（服务统计）

### 任务 4：前端页面（内容审核）
**文件列表：**
- `src/features/Admin/ContentModeration/ContentModerationList.tsx` - 内容审核列表页面
- `src/routes/(main)/admin/content-moderation/index.tsx` - 路由文件
- `src/services/admin/content-moderation.ts` - 前端服务

**功能：**
- [ ] 审核日志列表（表格）
- [ ] 筛选（用户、内容类型、审核结果、时间范围）
- [ ] 审核详情（侧边栏或弹窗）
- [ ] 审核操作（通过/拒绝）

### 任务 5：前端页面（系统健康监控）
**文件列表：**
- `src/features/Admin/SystemHealth/SystemHealthDashboard.tsx` - 系统健康仪表盘页面
- `src/routes/(main)/admin/system-health/index.tsx` - 路由文件
- `src/services/admin/system-health.ts` - 前端服务

**功能：**
- [ ] 系统健康概览（统计卡片）
- [ ] 服务状态列表（表格）
- [ ] 健康检查历史（图表）
- [ ] 告警配置（表单）

## 执行步骤

### 第一天：阶段二（消费与交易管理）
1. 创建订阅管理页面（SubscriptionList.tsx）
2. 创建积分交易管理页面（CreditTransactionList.tsx）
3. 创建消费记录页面（SpendList.tsx）
4. 添加路由配置
5. 更新侧边栏菜单
6. 添加 i18n 翻译
7. 运行 TypeScript 编译检查

### 第二天：阶段三（审核与监控）
1. 数据库迁移（content_moderation_logs / system_health_checks）
2. 创建后端 API（contentModerationRouter / systemHealthRouter）
3. 创建前端页面（ContentModerationList.tsx / SystemHealthDashboard.tsx）
4. 添加路由配置
5. 更新侧边栏菜单
6. 添加 i18n 翻译
7. 运行 TypeScript 编译检查

## 检查清单

执行完后，检查以下内容：

### 功能完整性检查
- [ ] 订阅管理页面：列表、筛选、创建、编辑、取消、续订
- [ ] 积分交易页面：列表、筛选、调整积分、导出
- [ ] 消费记录页面：列表、筛选、统计、导出
- [ ] 内容审核页面：列表、筛选、详情、审核操作
- [ ] 系统健康页面：概览、列表、历史、告警配置

### 后端 API 检查
- [ ] 所有 router 已注册到 lambdaRouter
- [ ] 所有 model 已正确实现
- [ ] 所有 schema 已正确定义
- [ ] TypeScript 编译通过

### 前端检查
- [ ] 所有页面组件已创建
- [ ] 所有路由已配置
- [ ] 侧边栏菜单已更新
- [ ] i18n 翻译已添加
- [ ] TypeScript 编译通过
- [ ] Lint 检查通过

### 优化点
- [ ] 页面加载性能（分页、虚拟滚动）
- [ ] 表单验证（创建/编辑弹窗）
- [ ] 错误处理（API 调用失败）
- [ ] 用户体验（加载状态、空状态、错误状态）
- [ ] 响应式设计（移动端适配）

## 风险提示

1. **数据库迁移风险**：确保迁移脚本正确，避免数据丢失。
2. **后端 API 风险**：确保 API 参数和返回值类型正确。
3. **前端页面风险**：确保页面组件正确连接到后端 API。
4. **i18n 风险**：确保翻译 key 存在且正确。

## 成功标准

1. ✅ 所有功能已实现
2. ✅ TypeScript 编译通过（0 错误）
3. ✅ Lint 检查通过（0 错误）
4. ✅ 所有页面可以正常访问
5. ✅ 所有 API 可以正常调用
