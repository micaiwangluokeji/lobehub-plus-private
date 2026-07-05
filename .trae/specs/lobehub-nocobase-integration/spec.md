# LobeHub + NocoBase 管理后台集成方案

## Why

LobeHub 开源版缺少可视化的超级管理员后台，需要开发订阅管理、用户管理、角色权限配置等功能。同时，NocoBase 是一个成熟的"AI + 无代码"管理后台平台，可以快速搭建企业管理界面。

本方案探索将 LobeHub 与 NocoBase 结合的可行性和最佳实践。

## What Changes

- 分析 LobeHub 与 NocoBase 的集成方案
- 评估不同集成模式的优缺点
- 确定最佳集成路径

## Impact

- 影响范围：LobeHub 管理后台开发方向
- 集成复杂度：中等至高
- 开发周期：根据方案不同，4-12 周不等

## ADDED Requirements

### Requirement: LobeHub + NocoBase 集成方案

LobeHub 与 NocoBase 的集成应采用以下三种模式之一：

#### Scenario: 方案一 - NocoBase 直连 LobeHub 数据库

- **WHEN** 需要快速搭建管理界面、管理 LobeHub 用户/角色/工作区数据
- **THEN** 采用 NocoBase 直连 LobeHub 的 PostgreSQL 数据库，通过 FDW 或外部数据源方式访问
- **适用场景**：内部管理后台，数据实时性要求高

#### Scenario: 方案二 - NocoBase 独立数据库 + LobeHub API

- **WHEN** 需要独立演进的管理后台，希望管理界面与 LobeHub 核心解耦
- **THEN** NocoBase 使用独立数据库，通过 API 与 LobeHub 通信
- **适用场景**：多租户 SaaS，需要独立的管理后台

#### Scenario: 方案三 - NocoBase 插件集成

- **WHEN** 需要深度集成，将管理功能嵌入 LobeHub 生态
- **THEN** 开发 NocoBase 插件，连接 LobeHub 数据库和服务
- **适用场景**：希望使用 NocoBase UI 风格，同时保持与 LobeHub 的紧密集成

### Requirement: NocoBase 数据源连接能力

系统 SHALL 支持 NocoBase 连接到 LobeHub 的 PostgreSQL 数据库：

#### Scenario: NocoBase 连接 LobeHub 数据库（外部 PostgreSQL）

- **WHEN** 管理员在 NocoBase 中配置外部数据源
- **THEN** NocoBase 能够：
  - 读取 LobeHub 用户表（users）
  - 读取 LobeHub 工作区表（workspaces）
  - 读取 LobeHub RBAC 表（rbac_roles, rbac_permissions, rbac_user_roles）
  - CRUD 用户和工作区配置
- **限制**：部分系统表（如密码哈希）应只读

### Requirement: NocoBase API 集成能力

LobeHub SHALL 提供必要的 API 支持 NocoBase 集成：

#### Scenario: NocoBase 通过 API 管理订阅

- **WHEN** NocoBase 管理后台需要创建/修改订阅套餐
- **THEN** LobeHub 提供 REST API：
  - `GET /api/admin/subscriptions` - 获取订阅列表
  - `POST /api/admin/subscriptions` - 创建订阅
  - `PUT /api/admin/subscriptions/:id` - 更新订阅
  - `DELETE /api/admin/subscriptions/:id` - 删除订阅

#### Scenario: NocoBase 通过 API 管理用户

- **WHEN** NocoBase 管理后台需要创建/修改用户
- **THEN** LobeHub 提供 REST API：
  - `GET /api/admin/users` - 获取用户列表
  - `POST /api/admin/users` - 创建用户
  - `PUT /api/admin/users/:id` - 更新用户
  - `DELETE /api/admin/users/:id` - 删除用户
  - `POST /api/admin/users/:id/roles` - 分配角色

## MODIFIED Requirements

### Requirement: LobeHub 管理 API 扩展

现有 LobeHub API 需要扩展以支持管理后台功能：

#### Scenario: 新增管理员权限中间件

- **WHEN** 调用管理 API
- **THEN** 需要验证：
  - 请求来自已认证的管理员
  - 管理员具有 `super_admin` 角色
  - 操作在权限范围内

## REMOVED Requirements

### Requirement: N/A

无移除需求。

## 集成方案对比

| 方案 | 复杂度 | 开发周期 | 维护成本 | 数据一致性 | 推荐度 |
|------|--------|---------|---------|-----------|--------|
| 方案一：直连数据库 | 低 | 1-2 周 | 低 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 方案二：独立数据库 + API | 中 | 4-6 周 | 中 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案三：NocoBase 插件 | 高 | 8-12 周 | 高 | ⭐⭐⭐⭐ | ⭐⭐ |

## 推荐方案：方案一 + 方案二 混合

**最佳实践**：
1. **短期**：采用方案一（NocoBase 直连 LobeHub 数据库）
   - 快速上线管理后台
   - 验证业务需求
   - 最小开发投入

2. **长期**：迁移到方案二（独立数据库 + API）
   - 随着业务增长，解耦管理后台
   - 独立演进，互不干扰
   - 支持多租户扩展

## 技术细节

### NocoBase 连接 LobeHub 数据库配置

```yaml
# NocoBase 外部数据源配置
dataSources:
  - name: lobehub
    type: postgres
    host: localhost
    port: 5432
    database: lobehub
    username: nocobase_admin
    password: ${NOCOBASE_ADMIN_PASSWORD}
```

### LobeHub 管理 API 设计

```typescript
// API 路由设计
POST   /api/admin/users              // 创建用户
GET    /api/admin/users              // 用户列表
GET    /api/admin/users/:id          // 用户详情
PUT    /api/admin/users/:id          // 更新用户
DELETE /api/admin/users/:id          // 删除用户
POST   /api/admin/users/:id/roles   // 分配角色

POST   /api/admin/workspaces         // 创建工作区
GET    /api/admin/workspaces        // 工作区列表
PUT    /api/admin/workspaces/:id    // 更新工作区
DELETE /api/admin/workspaces/:id    // 删除工作区

POST   /api/admin/plans             // 创建套餐
GET    /api/admin/plans             // 套餐列表
PUT    /api/admin/plans/:id         // 更新套餐
DELETE /api/admin/plans/:id         // 删除套餐

POST   /api/admin/orders            // 创建订单
GET    /api/admin/orders            // 订单列表
PUT    /api/admin/orders/:id/status // 更新订单状态

GET    /api/admin/stats/users       // 用户统计
GET    /api/admin/stats/revenue     // 收入统计
GET    /api/admin/stats/usage       // 用量统计
```

### RBAC 表结构（已存在）

LobeHub 已有完整的 RBAC 表结构：
- `rbac_roles` - 角色表
- `rbac_permissions` - 权限表
- `rbac_role_permissions` - 角色-权限关联
- `rbac_user_roles` - 用户-角色关联

这些表可以被 NocoBase 直接访问和管理。

## 风险与限制

1. **数据库共享风险**：方案一共享数据库，可能导致冲突
2. **API 稳定性**：方案二需要 LobeHub 提供稳定的 API
3. **权限安全**：管理 API 需要严格的权限验证
4. **数据一致性**：跨系统操作需要事务支持
