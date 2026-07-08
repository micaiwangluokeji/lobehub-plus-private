---
name: admin-review-move-and-fixes
overview: 1) 将 /settings/review 页面迁移到管理后台并加入侧边栏；2) 修复 Models/Content Moderation/Credit Transactions/System Health/Roles 等5个页面的前后端路由/类型不匹配问题。
todos:
  - id: create-branch
    content: 创建新分支 fix/admin-review-and-api-mismatch-codebuddy 基于 main
    status: completed
  - id: migrate-review-page
    content: 迁移 Review 页面到管理后台（路由/Sidebar/i18n/组件）
    status: completed
    dependencies:
      - create-branch
  - id: fix-models-api
    content: 修复 Models 页面路由参数不匹配（添加 /:id 路由）
    status: completed
    dependencies:
      - create-branch
  - id: fix-content-moderation-api
    content: 修复 Content Moderation 缺失路由
    status: completed
    dependencies:
      - create-branch
  - id: fix-credit-tx-api
    content: 修复 Credit Transactions 缺失路由
    status: completed
    dependencies:
      - create-branch
  - id: fix-system-health-api
    content: 修复 System Health 路由路径不匹配
    status: completed
    dependencies:
      - create-branch
  - id: fix-roles-schema
    content: 修复 Roles 页面 displayName 必填性不一致
    status: completed
    dependencies:
      - create-branch
---

## 需求一：Review 页面迁移到管理后台

将 `/settings/review` 页面（superadmin 批准用户将 agent/group 发布到 discover 页面的审核功能）转移到管理后台。

- 布局：在管理后台侧边栏"智能体管理"分组下新增"审核管理"导航项（路径 `/admin/review`）
- 功能：保持现有审核功能不变（两个标签页：agent/group，显示待审核列表，批准/拒绝按钮）
- 即时生效：superadmin 审批通过后，立即在前端生效（无需刷新页面）
- 原入口：保留 `/settings/review` 路由，设置页中该入口仍可访问（或设置为重定向）

## 需求二：修复管理后台 5 个页面的前后端 API 不匹配

以下页面存在前后端 API 不匹配，导致操作失败：

1. **Models** (`/admin/models`) — 前端发 `/:id`（单 UUID），后端路由 `/:providerId/:modelId`（双参数），且缺少 DELETE 路由
2. **Content Moderation** (`/admin/content-moderation`) — 前端 5 个端点（list/getById/create/updateStatus/stats），后端只有 2 个（list/update）
3. **Credit Transactions** (`/admin/credit-transactions`) — 前端 5 个端点（list/getById/create/getUserBalance/adjustCredits），后端只有 2 个（list/adjustCredits）
4. **System Health** (`/admin/system-health`) — 前端 5 个端点路径与后端完全不匹配
5. **Roles** (`/admin/roles`) — 创建角色时前端 `displayName` 是 optional，后端 Zod 是 required

## 技术栈

- 项目现有技术栈：React 19 + TypeScript + Next.js 16
- 管理后台：SPA 路由（react-router-dom），在 `src/spa/router/` 中配置
- 前端 UI：antd + @lobehub/ui
- 后端 API：tRPC（lambda）+ OpenAPI Hono 路由（`packages/openapi/src/routes/`）
- 数据获取：SWR
- 已有审核后端 tRPC 端点：`agent.approveAgentReview`、`agent.rejectAgentReview`、`agent.getPendingAgentReviews`、`group.approveGroupReview`、`group.rejectGroupReview`、`group.getPendingGroupReviews`

## 实现方案

### 1. Review 页面迁移

#### 1.1 页面迁移方案

- 复用现有 `src/features/Review/index.tsx` 组件，不重新开发
- 在 `src/features/Admin/Review/index.tsx` 中引入原组件并导出
- 创建路由文件 `src/routes/(main)/admin/review/index.tsx`
- 注册路由到两个 desktop router config 文件
- 侧边栏 "智能体管理" 分组下新增 "审核管理"（在知识库管理之后）

#### 1.2 即时生效方案

- 已有后端 tRPC procedure 在批准后会调用 `publishFeatureFlags` 写入 Redis，使配置立即生效
- 前端的 SWR 数据在审批/拒绝成功后调用 `mutate()` 刷新列表（原组件已有 `onSuccess` 回调，需确保传入 `mutate` 函数）

#### 1.3 权限控制

- 使用 `usePermission('manage_official_agents')` 守卫（与现有逻辑一致）
- 侧边栏仅对拥有该权限的用户可见

### 2. 五个 API 不匹配修复

#### 2.1 Models 页面

**方案**：保持前后端兼容，添加单参数 `:id` 路由

- 后端添加 `GET /:id`、`PATCH /:id`、`DELETE /:id` 路由
- 控制器从 ID 反查 `providerId + modelId`（因为 models 表的主键或唯一索引可能是复合键，需要确认实际查询方式）
- 添加 `ModelIdParamSchema`（z.object({ id: z.string() })）

#### 2.2 Content Moderation

**方案**：补齐缺失的后端路由

- 添加 `GET /:id`（getById）
- 添加 `POST /`（create）
- 保留 `PATCH /:id`，同时添加 `POST /:id/status` 或让前端改为 `PATCH /:id`
- 添加 `GET /stats`（getModerationStats）

#### 2.3 Credit Transactions

**方案**：补齐缺失的后端路由

- 添加 `GET /:id`（getById）
- 添加 `POST /`（create）
- 添加 `GET /balance`（getUserBalance）

#### 2.4 System Health

**方案**：对齐前后端路径，以后端为基准调整前端

- 前端 list → `GET /system-health/checks`
- 前端 getHealthStatus → `GET /system-health/dashboard`
- 添加 `GET /:id`、`POST /`、`GET /stats/:serviceName`（如需使用）

#### 2.5 Roles

**方案**：修改后端 Zod schema

- 将 `displayName: z.string().min(1)` 改为 `displayName: z.string().min(1).nullish()`

## 目录结构（仅列新增/修改文件）

```
project-root/
├── src/
│   ├── features/
│   │   ├── Admin/
│   │   │   ├── Layout/
│   │   │   │   └── AdminSidebar.tsx        [MODIFY] 新增"审核管理"导航项
│   │   │   └── Review/
│   │   │       └── index.tsx                [NEW] 引入原 Review 组件并导出
│   │   └── Review/
│   │       └── index.tsx                    [UNCHANGED] 保持原组件不变
│   ├── routes/
│   │   └── (main)/
│   │       └── admin/
│   │           └── review/
│   │               └── index.tsx            [NEW] 审核管理路由页面
│   ├── spa/
│   │   └── router/
│   │       ├── desktopRouter.config.tsx     [MODIFY] 添加 /admin/review 路由
│   │       └── desktopRouter.config.desktop.tsx  [MODIFY] 同步添加路由
│   └── locales/
│       └── default/
│           └── admin.ts                     [MODIFY] 添加 nav.review i18n key
├── packages/
│   └── openapi/
│       └── src/
│           ├── routes/
│           │   ├── models.route.ts          [MODIFY] 添加 /:id 路由
│           │   ├── content-moderation.route.ts  [MODIFY] 补齐缺失路由
│           │   ├── credit-transactions.route.ts [MODIFY] 补齐缺失路由
│           │   └── system-health.route.ts   [MODIFY] 对齐路由路径
│           ├── controllers/
│           │   ├── models.controller.ts     [MODIFY] 添加 /:id 的 CRUD 方法
│           │   ├── content-moderation.controller.ts [MODIFY] 添加缺失方法
│           │   ├── credit-transactions.controller.ts [MODIFY] 添加缺失方法
│           │   └── system-health.controller.ts [MODIFY] 对齐方法
│           └── types/
│               ├── model.type.ts            [MODIFY] 添加 ModelIdParamSchema
│               └── role.type.ts             [MODIFY] displayName 改为 nullish
```

## 关键技术决策

1. **Review 是否重写**：不重写，直接引入现有组件。组件本身已完善（权限守卫、SWR 数据获取、批准/拒绝按钮），迁移成本最小。
2. **即时生效机制**：后端 approveReview/rejectReview 已调用 `publishFeatureFlags` 推送到 Redis。前端 SWR 的 `mutate()` 在审批后触发即可刷新列表。无需额外后端修改。
3. **Models 路由方案**：添加单参数 `:id` 路由而非重构前端，因为前端多处使用 `id`（UUID），改动面最小。控制器内部通过 models 表查询将 UUID 映射到 providerId+modelId。
4. **其余页面补齐方案**：优先补齐后端路由和控制器，保持前端不变，避免前端的多处调用修改。

## Agent Extensions

### SubAgent

- **code-explorer**：用于初步代码探索和定位具体修改点
- **bmad-dev**：用于按计划执行一系列代码修改任务

### Skill

- **self-improving agent**：在执行过程中遇到问题时记录学习经验
