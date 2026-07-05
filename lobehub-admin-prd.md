# LobeHub 管理后台（Admin Panel）PRD 文档

> **版本**：v1.0  
> **状态**：待确认  
> **项目**：LobeHub Canary  
> **后端 API**：全部现成（OpenAPI + tRPC）  
> **前端 UI**：全部需要开发  

---

## 一、项目概述

### 1.1 背景

LobeHub 目前**没有完整的管理员后台管理面板**，所有管理操作需要直接操作数据库或通过 API 调试。虽然后端已经具备完整的 API 体系（OpenAPI REST 13 个路由 + tRPC 70+ router + RBAC 权限系统），但缺少可视化的管理界面。

### 1.2 目标

在 LobeHub 源码内新增 `/admin/*` 路由，开发一套完整的管理后台，覆盖以下管理功能：

| # | 页面 | 说明 |
|---|------|------|
| 1 | 仪表盘 | 系统概览、核心统计数据 |
| 2 | 用户管理 | 用户列表、搜索、创建、编辑、删除、角色分配 |
| 3 | 用户详情 | 单用户详情 + 角色管理 |
| 4 | 角色管理 | 角色列表、创建、编辑、权限绑定 |
| 5 | 权限管理 | 权限列表（只读展示） |
| 6 | 工作区管理 | 工作区列表、冻结、删除 |
| 7 | Agent 管理 | Agent 列表、管理 |
| 8 | 消息管理 | 消息查看、搜索、删除 |
| 9 | 文件管理 | 文件列表、管理 |
| 10 | 知识库管理 | 知识库列表、管理 |
| 11 | 模型管理 | AI 模型列表、管理 |
| 12 | 供应商管理 | AI 供应商列表、管理 |
| 13 | API Key 管理 | API Key 列表、管理 |
| 14 | 审计日志 | 操作日志查看、搜索 |
| 15 | 系统配置 | 系统级配置管理 |

### 1.3 核心原则

1. **只写前端 UI**：所有后端 API 全部现成，不修改后端
2. **不依赖第三方**：在 LobeHub 源码内开发，与主线同步更新
3. **复用现有架构**：tRPC client、@lobehub/ui、RBAC 权限系统
4. **权限控制**：仅 `super_admin` 可访问管理后台

---

## 二、现有资源清单

### 2.1 OpenAPI REST 路由

所有 OpenAPI 路由定义在 `packages/openapi/src/routes/` 目录下，使用 **Hono** 框架实现，路径前缀为 `/api/v1/*`。

| 路由模块 | 文件路径 | 功能 | 可用方法 | 所需权限 |
|---------|---------|------|---------|---------|
| **users** | `routes/users.route.ts` | 用户 CRUD + 角色管理 | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id`, GET `/:id/roles`, PATCH `/:id/roles`, DELETE `/:id/roles` | `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `RBAC_USER_ROLE_*` |
| **roles** | `routes/roles.route.ts` | 角色 CRUD + 权限绑定 | GET `/`, POST `/`, GET `/:id`, GET `/:id/permissions`, PATCH `/:id/permissions` | `RBAC_ROLE_*` |
| **permissions** | `routes/permissions.route.ts` | 权限 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `RBAC_PERMISSION_*` |
| **agents** | `routes/agents.route.ts` | Agent CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `AGENT_*` |
| **agent-groups** | `routes/agent-groups.route.ts` | Agent 分组 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `AGENT_*` |
| **messages** | `routes/messages.route.ts` | 消息查询 + 删除 | GET `/`, DELETE `/:id` | `MESSAGE_*` |
| **topics** | `routes/topics.route.ts` | 话题/主题 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `TOPIC_*` |
| **models** | `routes/models.route.ts` | AI 模型 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `AI_MODEL_*` |
| **providers** | `routes/providers.route.ts` | AI 供应商 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `AI_PROVIDER_*` |
| **files** | `routes/files.route.ts` | 文件查询 + 删除 | GET `/`, GET `/:id`, DELETE `/:id` | `FILE_*` |
| **knowledge-bases** | `routes/knowledge-bases.route.ts` | 知识库 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `KNOWLEDGE_BASE_*` |
| **message-translations** | `routes/message-translations.route.ts` | 消息翻译 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | `TRANSLATION_*` |
| **responses** | `routes/responses.route.ts` | 响应管理 CRUD | GET `/`, POST `/`, GET `/:id`, PATCH `/:id`, DELETE `/:id` | — |

> **认证方式**：所有路由均通过 `requireAuth` 中间件，支持 `Authorization: Bearer <token>`，token 可以是 API Key（格式 `sk-lh-{16位字母数字}`）或 OIDC JWT Token。

> **通用分页参数**：所有列表接口支持 `keyword`（可选）、`page`（最小1）、`pageSize`（1-100），响应含 `total` 字段。

### 2.2 tRPC Lambda Router

#### 2.2.1 主项目 Router（`apps/server/src/routers/lambda/`）—— 158 个文件

以下是与管理后台直接相关的核心 Router：

| Router 名称 | 对应文件 | 核心 Procedures | 前端调用方式 |
|------------|---------|----------------|-------------|
| **userRouter** | `lambda/user.ts` | `getUserById`, `getUserRoles`, `getUserPermissions`, `updateUserRoles` | `lambdaClient.user.*` |
| **apiKeyRouter** | `lambda/apiKey.ts` | `listApiKeys`, `createApiKey`, `regenerateApiKey`, `revokeApiKey`, `getApiKeyStats` | `lambdaClient.apiKey.*` |
| **aiAgentRouter** | `lambda/aiAgent.ts` | `getAllAgents`, `getAgentById`, `createAgent`, `updateAgent`, `deleteAgent` | `lambdaClient.aiAgent.*` |
| **aiModelRouter** | `lambda/aiModel.ts` | `getModelsByProvider`, `getAllModels`, `createModel`, `updateModel`, `deleteModel`, `toggleModelEnabled` | `lambdaClient.aiModel.*` |
| **aiProviderRouter** | `lambda/aiProvider.ts` | `getAllProviders`, `getProviderById`, `createProvider`, `updateProvider`, `deleteProvider`, `toggleProviderEnabled` | `lambdaClient.aiProvider.*` |
| **agentRouter** | `lambda/agent.ts` | `createAgent`, `getAgentById`, `getAllAgents`, `updateAgent`, `deleteAgent`, `duplicateAgent` | `lambdaClient.agent.*` |
| **agentGroupRouter** | `lambda/agentGroup.ts` | `createGroup`, `getGroupById`, `getAllGroups`, `updateGroup`, `deleteGroup` | `lambdaClient.agentGroup.*` |
| **messageRouter** | `lambda/message.ts` | `listMessages`, `getMessageById`, `removeMessage`, `batchRemoveMessages` | `lambdaClient.message.*` |
| **topicRouter** | `lambda/topic.ts` | `listTopics`, `getTopicById`, `createTopic`, `updateTopic`, `removeTopic`, `removeAllTopics` | `lambdaClient.topic.*` |
| **sessionRouter** | `lambda/session.ts` | `listSessions`, `getSessionById`, `createSession`, `updateSession`, `deleteSession` | `lambdaClient.session.*` |
| **sessionGroupRouter** | `lambda/sessionGroup.ts` | `listGroups`, `createGroup`, `updateGroup`, `deleteGroup` | `lambdaClient.sessionGroup.*` |
| **fileRouter** | `lambda/file.ts` | `listFiles`, `getFileById`, `removeFile`, `removeAllFiles` | `lambdaClient.file.*` |
| **knowledgeBaseRouter** | `lambda/knowledgeBase.ts` | `listBases`, `getBaseById`, `createBase`, `updateBase`, `deleteBase` | `lambdaClient.knowledgeBase.*` |

#### 2.2.2 business-server Router（`packages/business-server/src/lambda-routers/`）—— 17 个文件

| Router 名称 | 对应文件 | 核心 Procedures | 前端调用方式 |
|------------|---------|----------------|-------------|
| **workspaceRouter** | `workspace.ts` | `list`, `create`, `getById`, `getBySlug`, `update`, `delete`, `countUserWorkspaces` | `lambdaClient.workspace.*` |
| **workspaceMemberRouter** | `workspaceMember.ts` | `list`, `updateRole`, `remove`, `invite`, `acceptInvitation`, `declineInvitation` | `lambdaClient.workspaceMember.*` |
| **pageShareRouter** | `pageShare.ts` | `getShareSettings`, `updateShareSettings`, `getSharedDocument` | `lambdaClient.pageShare.*` |

#### 2.2.3 空壳 Router（需后端补充实现）

| Router 名称 | 当前状态 |
|------------|---------|
| **workspaceAuditLogRouter** | `export const workspaceAuditLogRouter = router({})` — 无任何 procedures |
| accountDeletionRouter | 空壳 |
| referralRouter | 空壳 |
| spendRouter | 空壳 |
| storageOverageRouter | 空壳 |
| subscriptionRouter | 空壳 |
| topUpRouter | 空壳 |
| workspaceCreditsRouter | 空壳 |
| workspaceCredsRouter | 空壳 |
| workspaceDataRouter | 空壳 |
| workspaceUsageRouter | 空壳 |

### 2.3 RBAC 权限系统

#### 2.3.1 角色定义

**全局角色（3 个）：**

| 角色常量 | 值 | 说明 |
|---------|-----|------|
| `SUPER_ADMIN` | `super_admin` | 拥有所有系统权限的超级管理员 |
| `VIP_USER` | `vip_user` | 拥有扩展权限的 VIP 用户 |
| `FREE_USER` | `free_user` | 拥有有限权限的免费用户 |

**工作区角色（3 个）：**

| 角色常量 | 值 | 说明 |
|---------|-----|------|
| `OWNER` | `workspace_owner` | 完全访问权限（计费、成员管理、所有内容） |
| `MEMBER` | `workspace_member` | 创建/编辑自己的内容，读取共享内容 |
| `VIEWER` | `workspace_viewer` | 只读访问工作区内容 |

#### 2.3.2 全部权限 Action 清单（19 个资源类别，72 个 action）

| 类别 | Action 列表 |
|------|------------|
| **Agent** | `agent:read`, `agent:create`, `agent:delete`, `agent:fork`, `agent:publish`, `agent:update`, `group:publish` |
| **AI 模型** | `ai_model:create`, `ai_model:delete`, `ai_model:read`, `ai_model:update`, `ai_model:invoke` |
| **AI 供应商** | `ai_provider:create`, `ai_provider:delete`, `ai_provider:read`, `ai_provider:update` |
| **API Key** | `api_key:create`, `api_key:delete`, `api_key:read`, `api_key:update` |
| **文档** | `document:create`, `document:delete`, `document:read`, `document:update` |
| **文件** | `file:delete`, `file:read`, `file:update`, `file:upload` |
| **知识库** | `knowledge_base:create`, `knowledge_base:delete`, `knowledge_base:read`, `knowledge_base:update` |
| **消息** | `message:create`, `message:delete`, `message:read`, `message:update` |
| **翻译** | `translation:create`, `translation:read`, `translation:delete`, `translation:update` |
| **RBAC** | `rbac:permission_create`, `rbac:permission_delete`, `rbac:permission_read`, `rbac:permission_update`, `rbac:role_create`, `rbac:role_delete`, `rbac:role_read`, `rbac:role_update`, `rbac:user_role_read`, `rbac:user_role_update`, `rbac:user_role_delete`, `rbac:user_permission_read`, `rbac:user_permission_update` |
| **Session** | `session:create`, `session:delete`, `session:read`, `session:update` |
| **Session Group** | `session_group:create`, `session_group:delete`, `session_group:read`, `session_group:update` |
| **Topic** | `topic:create`, `topic:delete`, `topic:read`, `topic:update` |
| **用户** | `user:create`, `user:delete`, `user:read`, `user:update` |
| **工作区** | `workspace:read`, `workspace:update`, `workspace:delete`, `workspace:settings_update`, `workspace:billing_read`, `workspace:billing_manage` |
| **工作区成员** | `workspace_member:read`, `workspace_member:invite`, `workspace_member:remove`, `workspace_member:update_role` |
| **工作区审计** | `workspace_audit:read` |
| **工作区角色** | `workspace_role:read`, `workspace_role:create`, `workspace_role:update`, `workspace_role:delete` |

#### 2.3.3 权限 Scope

| Scope | 值 | 含义 |
|-------|-----|------|
| ALL | `ALL` | 系统全局范围 / 工作区全局范围 |
| OWNER | `OWNER` | 只能操作自己的资源 |

权限编码完整格式：`resource:action:scope`（如 `agent:create:all`、`user:read:owner`）

Scope 策略规则：
- **RBAC 资源**（`rbac:*`）：仅 `ALL` 范围
- **工作区资源**（`workspace*`, `workspace_member*`, `workspace_audit*`, `workspace_role*`）：仅 `ALL` 范围
- **用户资源**（`user:*`）：`user:create` / `user:delete` 仅 `ALL`；`user:read` / `user:update` 允许 `ALL \| OWNER`
- **其他资源**：默认 `ALL \| OWNER`（双范围）

#### 2.3.4 前端权限 Hook

**`usePermission(action: string) => { allowed: boolean, reason: string }`**

| 语义 Action | 对应权限编码 | 用途 |
|------------|-------------|------|
| `create_content` | `agent:create:all` 或 `agent:create:owner` | 创建内容 |
| `edit_own_content` | `agent:update:all` 或 `agent:update:owner` | 编辑自己的资源 |
| `manage_settings` | 空数组（总是允许） | 个人设置管理 |
| `manage_provider_key` | 空数组（总是允许） | API Key 管理 |
| `manage_official_agents` | `agent:update:all` | 管理官方 agent（仅 super_admin） |
| `publish_agent` | `agent:update:all` 或 `agent:publish:owner` | 发布 agent |
| `publish_group` | `group:publish:all` 或 `group:publish:owner` | 发布分组 |

**`useUserRoles() => { roles: string[], primaryRole, isSuperAdmin, isVip, isFreeUser, isLoading }`**

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `roles` | `string[]` | 用户所有角色名称 |
| `primaryRole` | `'super_admin' \| 'vip_user' \| 'free_user'` | 最高优先级全局角色 |
| `isSuperAdmin` | `boolean` | 是否为超级管理员 |
| `isVip` | `boolean` | 是否为 VIP |
| `isFreeUser` | `boolean` | 是否为免费用户 |
| `isLoading` | `boolean` | 加载状态 |

角色优先级：`super_admin`(3) > `vip_user`(2) > `free_user`(1)

#### 2.3.5 后端权限中间件

| 中间件 | 适用场景 | 逻辑 | 说明 |
|--------|---------|------|------|
| `withRbacPermission(code)` | tRPC | OR | 要求单个权限编码 |
| `withAnyRbacPermission(codes[])` | tRPC | OR | 要求任意一个权限编码 |
| `withAllRbacPermissions(codes[])` | tRPC | AND | 要求全部权限编码 |
| `withScopedPermission(action)` | tRPC | OR | 糖函数：展开为 `action:all` + `action:owner` 双范围检查 |
| `requireSinglePermission(code)` | OpenAPI (Hono) | OR | 要求单个权限编码 |
| `requireAnyPermission(codes[])` | OpenAPI (Hono) | OR | 要求任意一个权限编码 |
| `requireAllPermissions(codes[])` | OpenAPI (Hono) | AND | 要求全部权限编码 |

#### 2.3.6 权限辅助函数

| 函数 | 签名 | 说明 |
|------|------|------|
| `getAllScopePermissions` | `(key: keyof PERMISSION_ACTIONS) => string[]` | 获取某个 action 所有允许 scope 的完整权限编码 |
| `getScopePermissions` | `(key: keyof PERMISSION_ACTIONS, scopes[]) => string[]` | 获取指定 scope 的权限编码 |

### 2.4 数据库 Schema

#### 2.4.1 用户相关表

| 表名 | 文件 | 核心字段 | 与 Admin 的关联 |
|------|------|---------|----------------|
| **users** | `schemas/users.ts` | `id`(PK), `username`(UNIQUE), `email`(UNIQUE), `avatar`, `fullName`, `banned`, `banReason`, `banExpires`, `lastActiveAt`, `createdAt`, `updatedAt`, `accessedAt` | **用户管理页面** — 主表，显示用户列表/详情 |
| **user_settings** | `schemas/user-settings.ts` | `id`(PK→FK users), `general`(JSONB), `languageModel`(JSONB), `keyVaults`(加密), `tts`(JSONB), `tool`(JSONB), `image`(JSONB), `notification`(JSONB) | 用户详情页可查看配置概览 |

#### 2.4.2 工作区相关表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **workspaces** | `id`(PK), `slug`(UNIQUE), `name`, `description`, `avatar`, `primaryOwnerId`(FK→users), `settings`(JSONB), `frozen`, `frozenReason`, `frozenAt`, `createdAt`, `updatedAt` | **工作区管理页面** — 主表 |
| **workspace_members** | `workspaceId`, `userId`, `role`('owner'\|'member'\|'viewer'), `joinedAt` | **工作区管理页面** — 显示成员数、成员列表 |

#### 2.4.3 RBAC 权限表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **rbac_roles** | `id`(PK), `name`, `displayName`, `description`, `isSystem`, `isActive`, `workspaceId`, `metadata`(JSONB) | **角色管理页面** — 主表 |
| **rbac_permissions** | `id`(PK), `code`(UNIQUE), `name`, `description`, `category`, `isActive` | **权限管理页面** — 主表 |
| **rbac_role_permissions** | `roleId`, `permissionId`(联合PK), `grantedAt` | **角色管理页面** — 权限绑定数据 |
| **rbac_user_roles** | `userId`, `roleId`, `workspaceId`, `expiresAt` | **用户管理页面** — 角色分配数据 |

#### 2.4.4 AI 相关表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **ai_providers** | `id`(PK), `name`, `label`, `description`, `enabled`, `sort`, `settings`(JSONB) | **供应商管理页面** — 主表 |
| **ai_models** | `id`(PK), `slug`, `displayName`, `providerId`(FK→ai_providers), `enabled`, `sort`, `pricing`(JSONB), `capabilities`(JSONB) | **模型管理页面** — 主表，关联供应商 |

#### 2.4.5 会话和消息相关表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **sessions** | `id`(PK), `title`, `userId`, `workspaceId`, `groupd`, `pinned`, `metadata`(JSONB) | 可通过消息管理页面间接查看 |
| **session_groups** | `id`(PK), `name`, `userId`, `workspaceId`, `sort` | — |
| **messages** | `id`(PK), `sessionId`(FK→sessions), `userId`, `role`, `content`, `model`, `tokens`, `metadata`(JSONB) | **消息管理页面** — 主表 |
| **message_translations** | `id`(PK), `messageId`(FK→messages), `targetLanguage`, `translatedContent` | 消息详情可展示翻译 |
| **topics** | `id`(PK), `title`, `sessionId`(FK→sessions), `userId`, `pinned`, `historySummary` | **话题管理页面**（可选） |

#### 2.4.6 Agent 相关表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **agents** | `id`(PK), `slug`, `title`, `description`, `systemRole`, `model`, `userId`, `groupd`, `featured`, `settings`(JSONB), `metadata`(JSONB) | **Agent 管理页面** — 主表 |
| **agent_groups** | `id`(PK), `name`, `userId`, `sort` | **Agent 管理页面** — 分组筛选 |

#### 2.4.7 文件和知识库表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **files** | `id`(PK), `name`, `size`, `type`, `url`, `userId`, `workspaceId`, `metadata`(JSONB), `chunkCount` | **文件管理页面** — 主表 |
| **knowledge_bases** | `id`(PK), `name`, `description`, `userId`, `workspaceId`, `embeddings`, `config`(JSONB) | **知识库管理页面** — 主表 |
| **knowledge_base_mapping** | `id`(PK), `knowledgeBaseId`, `fileId` | 知识库详情展示关联文件 |

#### 2.4.8 API Key 表

| 表名 | 核心字段 | 与 Admin 的关联 |
|------|---------|----------------|
| **api_key** | `id`(PK), `key`(UNIQUE), `userId`, `name`, `scope`, `permissions`(text[]), `enabled`, `lastUsedAt`, `expiresAt` | **API Key 管理页面** — 主表 |

### 2.5 前端 UI 资源

| 库名 | 版本 | 用途 |
|------|------|------|
| **@lobehub/ui** | — | 布局组件、通用 UI 组件 |
| **@lobehub/ui/base-ui** | — | Select, Modal, Popover, Switch 等无样式基础组件 |
| **antd** | 5.x | Table/ProTable, Form, DatePicker, Tag, Badge, Skeleton 等 |
| **antd-style** | — | CSS-in-JS 样式方案 |
| **@lucide/react** | — | 图标库 |
| **react-i18next** | — | 国际化 |
| **zustand** | — | 状态管理 |
| **SWR** | — | 数据获取（`useSWR` / `useSWRMutation`） |
| **react-router-dom** | — | 路由 |
| **tRPC React** | — | tRPC 客户端（`lambdaClient`） |

### 2.6 现有可复用代码模式

| 模式 | 位置 | 说明 |
|------|------|------|
| **SideBarLayout** | `src/features/NavPanel/SideBarLayout/` | 侧边栏布局容器组件 |
| **settings 页面布局** | `src/routes/(main)/settings/_layout/` | 左侧导航 + 右侧内容的完整布局 |
| **settings 路由元数据** | `src/routes/(main)/settings/features/routeMeta.ts` | 侧边栏导航项定义模式 |
| **tRPC lambdaClient** | `src/services/lambdaClient.ts` | 已配置好的 tRPC 客户端实例 |
| **usePermission hook** | `src/hooks/usePermission.ts` | 权限检查 hook |
| **useUserRoles hook** | `src/hooks/useUserRoles.ts` | 用户角色 hook |
| **RESERVED_FIRST_SEGMENTS** | `src/features/Workspace/useWorkspaceUrlSync.ts` | 保留 URL 首段数组 |

---

## 三、页面详细规划

### 3.1 仪表盘 `/admin/`

**功能说明**：系统概览，展示核心统计数据和快速入口

**数据来源与调用方式**：

| 数据项 | API 类型 | 具体调用 | 数据库表 |
|--------|---------|---------|---------|
| 用户总数 | OpenAPI | `GET /api/v1/users?page=1&pageSize=1`（取 total） | `users` |
| 昨日新增用户 | OpenAPI | `GET /api/v1/users?page=1&pageSize=1`（按创建时间过滤，需前端计算） | `users` |
| 工作区总数 | tRPC | `lambdaClient.workspace.list.query()`（取数组长度） | `workspaces` |
| Agent 总数 | OpenAPI | `GET /api/v1/agents?page=1&pageSize=1`（取 total） | `agents` |
| 消息总数 | OpenAPI | `GET /api/v1/messages?page=1&pageSize=1`（取 total） | `messages` |
| 文件总数 | OpenAPI | `GET /api/v1/files?page=1&pageSize=1`（取 total） | `files` |
| 知识库总数 | OpenAPI | `GET /api/v1/knowledge-bases?page=1&pageSize=1`（取 total） | `knowledge_bases` |
| 模型总数 | OpenAPI | `GET /api/v1/models?page=1&pageSize=1`（取 total） | `ai_models` |
| 供应商总数 | OpenAPI | `GET /api/v1/providers?page=1&pageSize=1`（取 total） | `ai_providers` |
| 在线用户 | — | 待定（需实时统计） | — |

**UI 方案**：
- 顶部 4-6 个统计卡片（StatisticCard）：显示数字 + 趋势箭头
- 中间 2 列布局：左侧"最近注册用户"列表，右侧"最近创建的工作区"列表
- 底部：系统健康状态概览

**开发量**：1 天

---

### 3.2 用户管理 `/admin/users`

**功能说明**：用户列表搜索、创建、编辑、删除、角色分配

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 用户列表 | OpenAPI | `GET /api/v1/users?keyword=&page=&pageSize=` | `users` |
| 创建用户 | OpenAPI | `POST /api/v1/users`（body: email, username, fullName, avatar, roleIds） | `users` + `rbac_user_roles` |
| 编辑用户 | OpenAPI | `PATCH /api/v1/users/:id`（body: avatar, email, username, isOnboarded） | `users` |
| 删除用户 | OpenAPI | `DELETE /api/v1/users/:id` | `users` |
| 查看用户角色 | OpenAPI | `GET /api/v1/users/:id/roles` | `rbac_user_roles` + `rbac_roles` |
| 更新用户角色 | OpenAPI | `PATCH /api/v1/users/:id/roles`（body: addRoles[], removeRoles[]） | `rbac_user_roles` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 头像 | `user.avatar` | Avatar 组件 | 30x30 圆形头像 |
| 用户名 | `user.username` | 文本 | 可点击进入详情 |
| 邮箱 | `user.email` | 文本 | — |
| 全名 | `user.fullName` | 文本 | — |
| 角色 | `user.roles`（从 `/:id/roles` 获取） | Tag 标签 | super_admin=红色, vip_user=金色, free_user=灰色 |
| 状态 | `user.banned` | Badge | banned=true 显示红色"封禁" |
| 最后活跃 | `user.lastActiveAt` | 相对时间（dayjs fromNow） | — |
| 创建时间 | `user.createdAt` | 格式化时间 | — |
| 操作 | — | 按钮组 | 编辑、管理角色、删除 |

**UI 方案**：
- 顶部：搜索栏（Input.Search） + "创建用户"按钮
- 主体：antd Table（支持分页、排序）
- 创建/编辑：Modal + Form（Form.Item 包含角色选择）
- 角色管理：Modal + Transfer/Checkbox 组件
- 删除：Popconfirm 二次确认

**开发量**：1.5 天

---

### 3.3 用户详情 `/admin/users/:id`

**功能说明**：单个用户的详细信息展示 + 角色分配管理 + 账号操作

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 用户基本信息 | OpenAPI | `GET /api/v1/users/:id` | `users` |
| 用户角色列表 | OpenAPI | `GET /api/v1/users/:id/roles` | `rbac_user_roles` + `rbac_roles` |
| 更新角色 | OpenAPI | `PATCH /api/v1/users/:id/roles` | `rbac_user_roles` |
| 清除角色 | OpenAPI | `DELETE /api/v1/users/:id/roles` | `rbac_user_roles` |
| 编辑用户 | OpenAPI | `PATCH /api/v1/users/:id` | `users` |
| 删除用户 | OpenAPI | `DELETE /api/v1/users/:id` | `users` |

**页面分区**：
1. **用户信息卡片**（顶部）：Avatar + 用户名 + 邮箱 + 全名 + 注册时间 + 最后活跃 + 封禁状态
2. **角色分配面板**（中间）：当前角色标签列表 + "添加角色"按钮 → 弹出可选角色列表
3. **账号操作**（底部）："编辑信息"按钮、"封禁/解封"按钮、"删除账号"按钮（红色，危险操作）

**UI 方案**：
- 顶部：Descriptions / Card 组件展示用户信息
- 角色区：Tag 列表 + Select/Modal 添加角色
- 操作区：Button（分普通/危险级别）

**开发量**：0.5 天

---

### 3.4 角色管理 `/admin/roles`

**功能说明**：角色列表查看、创建、编辑、权限绑定

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 角色列表 | OpenAPI | `GET /api/v1/roles?page=&pageSize=` | `rbac_roles` |
| 创建角色 | OpenAPI | `POST /api/v1/roles`（body: name, displayName, description, isActive, isSystem） | `rbac_roles` |
| 角色详情 | OpenAPI | `GET /api/v1/roles/:id` | `rbac_roles` |
| 角色权限映射 | OpenAPI | `GET /api/v1/roles/:id/permissions` | `rbac_role_permissions` + `rbac_permissions` |
| 更新权限 | OpenAPI | `PATCH /api/v1/roles/:id/permissions`（body: grant[], revoke[]） | `rbac_role_permissions` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 角色名称 | `role.name` | 文本 | 唯一标识 |
| 显示名称 | `role.displayName` | 文本 | UI 显示名称 |
| 描述 | `role.description` | 文本 + Tooltip（截断） | — |
| 类型 | `role.isSystem` | Tag | system=true 显示蓝色"系统"标签 |
| 状态 | `role.isActive` | Tag / Switch | active=true 显示绿色"已启用" |
| 权限数 | `role.permissions.length` | 数字 | 关联的权限数量 |
| 操作 | — | 按钮组 | 编辑、权限配置、删除 |

**UI 方案**：
- 主体：antd Table
- 创建/编辑：Modal + Form（完整信息表单）
- 权限配置：Drawer 侧边栏展开，左侧显示权限树（按 category 分组），右侧显示已选权限
- 系统角色（isSystem=true）不可删除，编辑按钮灰化

**开发量**：1 天

---

### 3.5 权限管理 `/admin/permissions`

**功能说明**：权限列表展示（只读，仅 super_admin 可管理）

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 权限列表 | OpenAPI | `GET /api/v1/permissions?page=&pageSize=&category=` | `rbac_permissions` |
| 权限详情 | OpenAPI | `GET /api/v1/permissions/:id` | `rbac_permissions` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 权限编码 | `permission.code` | 代码文本 | `resource:action:scope` 格式 |
| 名称 | `permission.name` | 文本 | 人类可读名称 |
| 描述 | `permission.description` | 文本 | — |
| 分类 | `permission.category` | Tag | 按资源类别分组颜色 |
| 状态 | `permission.isActive` | Tag | 启用/禁用 |
| 创建时间 | `permission.createdAt` | 时间文本 | — |

**UI 方案**：
- 顶部：分类筛选（Select 按 category 过滤）+ 搜索栏
- 主体：antd Table
- 分类颜色方案：用户=蓝色, Agent=绿色, 消息=紫色, 文件=橙色, 工作区=红色, RBAC=金色

**开发量**：0.5 天

---

### 3.6 工作区管理 `/admin/workspaces`

**功能说明**：工作区列表查看、冻结/解冻、删除

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 工作区列表 | tRPC | `lambdaClient.workspace.list.query()` | `workspaces` |
| 工作区详情 | tRPC | `lambdaClient.workspace.getById.query({ id })` | `workspaces` |
| 更新工作区 | tRPC | `lambdaClient.workspace.update.mutate({ id, ... })` | `workspaces` |
| 删除工作区 | tRPC | `lambdaClient.workspace.delete.mutate({ id })` | `workspaces` |
| 工作区成员 | tRPC | `lambdaClient.workspaceMember.list.query({ workspaceId })` | `workspace_members` |

> ⚠️ **注意**：工作区的 OpenAPI 路由当前不存在，所有操作通过 tRPC 调用

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 名称 | `workspace.name` | 文本 + Avatar | 工作区图标+名称 |
| Slug | `workspace.slug` | 文本 | URL 标识 |
| 所有者 | `workspace.primaryOwnerId` | 文本（需查用户表映射） | 主要所有者 |
| 成员数 | 关联 `workspaceMemberRouter.list` | 数字 | 当前成员数量 |
| 状态 | `workspace.frozen` | Tag | frozen=true 红色"已冻结" |
| 创建时间 | `workspace.createdAt` | 时间文本 | — |
| 操作 | — | 按钮组 | 详情、冻结/解冻、删除 |

**UI 方案**：
- 主体：antd Table
- 详情：Modal/描述面板展示完整信息 + 成员列表
- 冻结：Popconfirm 确认 + 输入冻结原因
- 删除：Popconfirm 红色警告

**开发量**：1 天

---

### 3.7 Agent 管理 `/admin/agents`

**功能说明**：Agent 列表查看、编辑、删除

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| Agent 列表 | OpenAPI | `GET /api/v1/agents?page=&pageSize=&keyword=` | `agents` |
| Agent 详情 | OpenAPI | `GET /api/v1/agents/:id` | `agents` |
| 编辑 Agent | OpenAPI | `PATCH /api/v1/agents/:id` | `agents` |
| 删除 Agent | OpenAPI | `DELETE /api/v1/agents/:id` | `agents` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 头像 | `agent.avatar` | Avatar | Agent 图标 |
| 标题 | `agent.title` | 文本 | 可点击进入详情 |
| Slug | `agent.slug` | 文本 | URL 标识 |
| 模型 | `agent.model` | Tag | 使用的 AI 模型 |
| 所有者 | `agent.userId` | 文本 | 创建者 |
| 分组 | `agent.groupId` | Tag | 所属 Agent 分组 |
| Featured | `agent.featured` | Tag | 是否推荐 |
| 创建时间 | `agent.createdAt` | 时间文本 | — |
| 操作 | — | 按钮组 | 编辑、删除 |

**开发量**：0.5 天

---

### 3.8 消息管理 `/admin/messages`

**功能说明**：消息列表查看、搜索、详情、删除

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 消息列表 | OpenAPI | `GET /api/v1/messages?page=&pageSize=&keyword=` | `messages` |
| 消息详情 | OpenAPI | `GET /api/v1/messages/:id`（需确认）或 tRPC `messageRouter.getMessageById` | `messages` |
| 删除消息 | OpenAPI | `DELETE /api/v1/messages/:id` | `messages` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 角色 | `message.role` | Tag（颜色编码） | user=蓝色, assistant=绿色, system=灰色 |
| 内容（截断） | `message.content` | 文本 / Tooltip | 超过 100 字符截断 |
| 会话 | `message.sessionId` | 文本 | 所属会话 ID（截断） |
| 用户 | `message.userId` | 文本 | 发送者 |
| 模型 | `message.model` | Tag | 使用的 AI 模型 |
| Token | `message.tokens` | 数字 | Token 消耗 |
| 时间 | `message.createdAt` | 相对时间 | — |
| 操作 | — | 按钮 | 详情、删除 |

**UI 方案**：
- 顶部：搜索栏 + 角色筛选（Select）
- 主体：antd Table
- 详情：Drawer 侧边栏展示完整消息内容 + 元数据（JSON 格式化显示）
- 批量删除：Checkbox 选择 + "批量删除"按钮

**开发量**：0.5 天

---

### 3.9 文件管理 `/admin/files`

**功能说明**：文件列表查看、详情、删除

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 文件列表 | OpenAPI | `GET /api/v1/files?page=&pageSize=&keyword=` | `files` |
| 文件详情 | OpenAPI | `GET /api/v1/files/:id` | `files` |
| 删除文件 | OpenAPI | `DELETE /api/v1/files/:id` | `files` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 文件名 | `file.name` | 文本 + 文件类型图标 | 可点击下载 |
| 类型 | `file.type` | Tag | 如 PDF, Image, Text |
| 大小 | `file.size` | 格式化文本 | 自动转为 KB/MB/GB |
| 上传者 | `file.userId` | 文本 | 上传用户 |
| 工作区 | `file.workspaceId` | 文本 | 所属工作区 |
| 分块数 | `file.chunkCount` | 数字 | 知识库分块数量 |
| 上传时间 | `file.createdAt` | 时间文本 | — |
| 操作 | — | 按钮 | 详情、删除 |

**开发量**：0.5 天

---

### 3.10 知识库管理 `/admin/knowledge-bases`

**功能说明**：知识库列表查看、创建、编辑、删除

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 知识库列表 | OpenAPI | `GET /api/v1/knowledge-bases?page=&pageSize=&keyword=` | `knowledge_bases` |
| 创建知识库 | OpenAPI | `POST /api/v1/knowledge-bases` | `knowledge_bases` |
| 知识库详情 | OpenAPI | `GET /api/v1/knowledge-bases/:id` | `knowledge_bases` |
| 编辑知识库 | OpenAPI | `PATCH /api/v1/knowledge-bases/:id` | `knowledge_bases` |
| 删除知识库 | OpenAPI | `DELETE /api/v1/knowledge-bases/:id` | `knowledge_bases` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 名称 | `kb.name` | 文本 | 知识库名称 |
| 描述 | `kb.description` | 文本 + Tooltip | — |
| 嵌入模型 | `kb.embeddings` | Tag | 使用的嵌入模型 |
| 文件数 | 关联计算 | 数字 | 关联的文件数量 |
| 创建者 | `kb.userId` | 文本 | 创建者 |
| 工作区 | `kb.workspaceId` | 文本 | 所属工作区 |
| 创建时间 | `kb.createdAt` | 时间文本 | — |
| 操作 | — | 按钮组 | 编辑、删除 |

**开发量**：0.5 天

---

### 3.11 模型管理 `/admin/models`

**功能说明**：AI 模型列表查看、创建、编辑、删除、启用/禁用

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 模型列表 | OpenAPI | `GET /api/v1/models?page=&pageSize=&providerId=` | `ai_models` |
| 创建模型 | OpenAPI | `POST /api/v1/models` | `ai_models` |
| 模型详情 | OpenAPI | `GET /api/v1/models/:id` | `ai_models` |
| 编辑模型 | OpenAPI | `PATCH /api/v1/models/:id` | `ai_models` |
| 删除模型 | OpenAPI | `DELETE /api/v1/models/:id` | `ai_models` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 模型标识 | `model.slug` | 代码文本 | 如 `gpt-4`, `claude-3` |
| 显示名称 | `model.displayName` | 文本 | UI 名称 |
| 供应商 | `model.providerId` | Tag | 关联的供应商名称 |
| 状态 | `model.enabled` | Switch | 直接切换启用/禁用 |
| 排序 | `model.sort` | 数字 | 展示排序 |
| 定价 | `model.pricing` | 文本 | 价格信息 |
| 能力 | `model.capabilities` | Tag 列表 | 如 vision, function_calling |
| 操作 | — | 按钮组 | 编辑、删除 |

**UI 方案**：
- 顶部：供应商筛选（Select）+ 搜索栏 + "创建模型"按钮
- 主体：antd Table（Switch 内联切换启用状态）
- 创建/编辑：Modal + Form

**开发量**：0.5 天

---

### 3.12 供应商管理 `/admin/providers`

**功能说明**：AI 供应商列表查看、创建、编辑、删除、启用/禁用

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| 供应商列表 | OpenAPI | `GET /api/v1/providers?page=&pageSize=&keyword=` | `ai_providers` |
| 创建供应商 | OpenAPI | `POST /api/v1/providers` | `ai_providers` |
| 供应商详情 | OpenAPI | `GET /api/v1/providers/:id` | `ai_providers` |
| 编辑供应商 | OpenAPI | `PATCH /api/v1/providers/:id` | `ai_providers` |
| 删除供应商 | OpenAPI | `DELETE /api/v1/providers/:id` | `ai_providers` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 名称 | `provider.name` | 文本 | 如 `openai`, `anthropic` |
| 标签 | `provider.label` | 文本 | UI 显示标签 |
| 描述 | `provider.description` | 文本 + Tooltip | — |
| 状态 | `provider.enabled` | Switch | 直接切换启用/禁用 |
| 模型数 | 关联查询 | 数字 | 关联的模型数量 |
| 排序 | `provider.sort` | 数字 | 展示排序 |
| 操作 | — | 按钮组 | 编辑、删除 |

**开发量**：0.5 天

---

### 3.13 API Key 管理 `/admin/api-keys`

**功能说明**：API Key 列表查看、创建、撤销、重新生成

**数据来源与调用方式**：

| 操作 | API 类型 | 具体调用 | 数据库表 |
|------|---------|---------|---------|
| API Key 列表 | tRPC | `lambdaClient.apiKey.listApiKeys.query()` | `api_key` |
| 创建 API Key | tRPC | `lambdaClient.apiKey.createApiKey.mutate({...})` | `api_key` |
| 撤销 API Key | tRPC | `lambdaClient.apiKey.revokeApiKey.mutate({id})` | `api_key` |
| 重新生成 | tRPC | `lambdaClient.apiKey.regenerateApiKey.mutate({id})` | `api_key` |
| 获取统计 | tRPC | `lambdaClient.apiKey.getApiKeyStats.query()` | `api_key` |

**表格列设计**：

| 列 | 数据字段 | 呈现方式 | 说明 |
|----|---------|---------|------|
| 名称 | `apiKey.name` | 文本 | Key 的标识名称 |
| Key（掩码） | `apiKey.key` | 密码文本 | `sk-lh-****...****` 部分隐藏 |
| 用户 | `apiKey.userId` | 文本 | 所属用户 |
| 权限 | `apiKey.permissions` | Tag 列表 | 拥有的权限范围 |
| 状态 | `apiKey.enabled` | Tag | 启用/已撤销 |
| 最后使用 | `apiKey.lastUsedAt` | 相对时间 | — |
| 过期时间 | `apiKey.expiresAt` | 时间文本 | — |
| 操作 | — | 按钮组 | 重新生成、撤销 |

**UI 方案**：
- 顶部："创建 API Key"按钮
- 主体：antd Table
- 创建：Modal + Form（名称、权限选择、过期时间）
- 创建成功后：一次性展示完整 Key（不可再次获取），提示用户复制保存
- 撤销：Popconfirm 确认

**开发量**：0.5 天

---

### 3.14 审计日志 `/admin/audit-logs`

> ⚠️ **注意**：当前 `workspaceAuditLogRouter` 为空壳 `router({})`，无实际 procedures。需要先补充后端实现才能开发前端页面。

**功能说明**：操作日志查看、搜索、时间范围过滤

**预期数据来源**：

| 操作 | API 类型 | 具体调用 |
|------|---------|---------|
| 日志列表 | tRPC | `workspaceAuditLogRouter.listLogs`（待后端实现） |
| 日志搜索 | tRPC | `workspaceAuditLogRouter.searchLogs`（待后端实现） |
| 日志详情 | tRPC | `workspaceAuditLogRouter.getLogById`（待后端实现） |

**预期表格列设计**：

| 列 | 说明 | 呈现方式 |
|----|------|---------|
| 时间 | 操作时间 | 格式化时间 |
| 用户 | 操作者用户名 | 文本 + Avatar |
| 操作类型 | create/update/delete | Tag（颜色编码） |
| 资源类型 | 操作对象类型 | Tag（按类别） |
| 资源 ID | 操作对象标识 | 代码文本 |
| 详情 | 操作详情 | 文本 / Drawer 完整展示 |
| IP 地址 | 操作者 IP | 文本 |

**UI 方案**：
- 顶部：时间范围选择 + 操作类型筛选 + 资源类型筛选 + 搜索栏
- 主体：antd Table
- 详情：Drawer 侧边栏展示

**开发量**：0.5 天（前端，不含后端补充）

---

### 3.15 系统配置 `/admin/settings`

> ⚠️ **注意**：系统配置后端 API 需先评估 `configRouter` 的可用配置项。`businessConfigEndpoints` 当前为空对象 `{}`。

**功能说明**：系统级配置管理

**预期数据来源**：

| 操作 | API 类型 | 具体调用 |
|------|---------|---------|
| 系统配置 | tRPC | `configRouter.*`（待评估） |
| 更新配置 | tRPC | `configRouter.*`（待评估） |

**预期配置项**：
- 系统名称
- 系统 Logo
- 默认语言
- 注册开关
- 最大文件上传大小
- AI 模型调用并发限制
- 日志保留天数

**UI 方案**：
- 分组表单（Form）：基本信息、安全设置、功能开关、高级配置
- 保存按钮（底部固定）

**开发量**：1 天

---

## 四、数据流向总览

### 4.1 OpenAPI 数据流（Hono REST）

```
前端组件
  ↓ 调用封装的 Service 层
Service 层 (src/services/admin/*.ts)
  ↓ fetch() 或 axios 调用 OpenAPI
OpenAPI 路由 (packages/openapi/src/routes/*.route.ts)
  ↓ requireAuth → requireAnyPermission(codes)
中间件层 (packages/openapi/src/middleware/)
  ↓
BaseService (packages/openapi/src/common/base.service.ts)
  ↓ hasGlobalPermission / hasOwnerPermission
RbacModel (packages/database/src/models/rbac.ts)
  ↓ 数据库查询
Drizzle ORM → PostgreSQL
```

### 4.2 tRPC 数据流

```
前端组件
  ↓ lambdaClient.{router}.{procedure}
tRPC Client (src/services/lambdaClient.ts)
  ↓ HTTP 请求
tRPC Lambda Router (apps/server/src/routers/lambda/*.ts)
  ↓ authedProcedure → workspaceProcedure → withScopedPermission
中间件链 (auth → workspaceAuth → RBAC)
  ↓
业务 Service → Drizzle ORM → PostgreSQL
```

### 4.3 管理后台完整数据映射矩阵

| 管理页面 | API 协议 | 后端端点 | 对应数据库表 | 前端 Service 文件 |
|---------|---------|---------|-------------|------------------|
| 仪表盘 | OpenAPI + tRPC | 多路由聚合 | 多表聚合 | `services/admin/dashboard.ts` |
| 用户列表 | OpenAPI | `GET /api/v1/users` | `users` | `services/admin/users.ts` |
| 创建用户 | OpenAPI | `POST /api/v1/users` | `users` + `rbac_user_roles` | `services/admin/users.ts` |
| 编辑用户 | OpenAPI | `PATCH /api/v1/users/:id` | `users` | `services/admin/users.ts` |
| 删除用户 | OpenAPI | `DELETE /api/v1/users/:id` | `users` | `services/admin/users.ts` |
| 用户角色 | OpenAPI | `GET/PATCH/DELETE /api/v1/users/:id/roles` | `rbac_user_roles` | `services/admin/users.ts` |
| 角色列表 | OpenAPI | `GET /api/v1/roles` | `rbac_roles` | `services/admin/roles.ts` |
| 创建角色 | OpenAPI | `POST /api/v1/roles` | `rbac_roles` | `services/admin/roles.ts` |
| 角色权限 | OpenAPI | `GET/PATCH /api/v1/roles/:id/permissions` | `rbac_role_permissions` | `services/admin/roles.ts` |
| 权限列表 | OpenAPI | `GET /api/v1/permissions` | `rbac_permissions` | `services/admin/permissions.ts` |
| 工作区列表 | tRPC | `workspaceRouter.list` | `workspaces` | `services/admin/workspaces.ts` |
| 工作区更新 | tRPC | `workspaceRouter.update` | `workspaces` | `services/admin/workspaces.ts` |
| 工作区删除 | tRPC | `workspaceRouter.delete` | `workspaces` | `services/admin/workspaces.ts` |
| 工作区成员 | tRPC | `workspaceMemberRouter.list` | `workspace_members` | `services/admin/workspaces.ts` |
| Agent 列表 | OpenAPI | `GET /api/v1/agents` | `agents` | `services/admin/agents.ts` |
| Agent 编辑 | OpenAPI | `PATCH /api/v1/agents/:id` | `agents` | `services/admin/agents.ts` |
| Agent 删除 | OpenAPI | `DELETE /api/v1/agents/:id` | `agents` | `services/admin/agents.ts` |
| 消息列表 | OpenAPI | `GET /api/v1/messages` | `messages` | `services/admin/messages.ts` |
| 消息删除 | OpenAPI | `DELETE /api/v1/messages/:id` | `messages` | `services/admin/messages.ts` |
| 文件列表 | OpenAPI | `GET /api/v1/files` | `files` | `services/admin/files.ts` |
| 文件删除 | OpenAPI | `DELETE /api/v1/files/:id` | `files` | `services/admin/files.ts` |
| 知识库列表 | OpenAPI | `GET /api/v1/knowledge-bases` | `knowledge_bases` | `services/admin/knowledge-bases.ts` |
| 模型列表 | OpenAPI | `GET /api/v1/models` | `ai_models` | `services/admin/models.ts` |
| 供应商列表 | OpenAPI | `GET /api/v1/providers` | `ai_providers` | `services/admin/providers.ts` |
| API Key 列表 | tRPC | `apiKeyRouter.listApiKeys` | `api_key` | `services/admin/api-keys.ts` |
| API Key 创建 | tRPC | `apiKeyRouter.createApiKey` | `api_key` | `services/admin/api-keys.ts` |
| API Key 撤销 | tRPC | `apiKeyRouter.revokeApiKey` | `api_key` | `services/admin/api-keys.ts` |
| 审计日志 | tRPC | `workspaceAuditLogRouter`（⚠️ 空壳） | 待补充 | `services/admin/audit-logs.ts` |
| 系统配置 | tRPC | `configRouter`（⚠️ 待评估） | 待补充 | `services/admin/settings.ts` |

---

## 五、路由与目录结构

### 5.1 路由配置

```typescript
// src/spa/router/desktopRouter.config.tsx
// 步骤1：在 RESERVED_FIRST_SEGMENTS 中添加 'admin'
// 步骤2：在路由树中添加以下配置

{
  path: 'admin',
  element: <AdminLayout />,      // 管理后台布局
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: 'users', element: <AdminUsers /> },
    { path: 'users/:id', element: <AdminUserDetail /> },
    { path: 'roles', element: <AdminRoles /> },
    { path: 'permissions', element: <AdminPermissions /> },
    { path: 'workspaces', element: <AdminWorkspaces /> },
    { path: 'agents', element: <AdminAgents /> },
    { path: 'messages', element: <AdminMessages /> },
    { path: 'files', element: <AdminFiles /> },
    { path: 'knowledge-bases', element: <AdminKnowledgeBases /> },
    { path: 'models', element: <AdminModels /> },
    { path: 'providers', element: <AdminProviders /> },
    { path: 'api-keys', element: <AdminApiKeys /> },
    { path: 'audit-logs', element: <AdminAuditLogs /> },
    { path: 'settings', element: <AdminSettings /> },
  ],
}
```

> **重要**：路由需要在 `desktopRouter.config.tsx` 和 `desktopRouter.config.desktop.tsx` 两个文件中同步配置，否则可能导致空白页面。

### 5.2 完整目录结构

```
src/
├── routes/(main)/admin/
│   ├── _layout/
│   │   ├── index.tsx              # 管理后台布局容器
│   │   ├── layout.tsx             # 布局样式组件
│   │   └── Sidebar.tsx            # 侧边栏导航
│   ├── index.tsx                  # 仪表盘页面
│   ├── users/
│   │   ├── index.tsx              # 用户列表页面（路由文件，薄层，只做导入组合）
│   │   └── [id].tsx              # 用户详情页面
│   ├── roles/
│   │   └── index.tsx              # 角色管理页面
│   ├── permissions/
│   │   └── index.tsx              # 权限管理页面
│   ├── workspaces/
│   │   └── index.tsx              # 工作区管理页面
│   ├── agents/
│   │   └── index.tsx              # Agent 管理页面
│   ├── messages/
│   │   └── index.tsx              # 消息管理页面
│   ├── files/
│   │   └── index.tsx              # 文件管理页面
│   ├── knowledge-bases/
│   │   └── index.tsx              # 知识库管理页面
│   ├── models/
│   │   └── index.tsx              # 模型管理页面
│   ├── providers/
│   │   └── index.tsx              # 供应商管理页面
│   ├── api-keys/
│   │   └── index.tsx              # API Key 管理页面
│   ├── audit-logs/
│   │   └── index.tsx              # 审计日志页面
│   └── settings/
│       └── index.tsx              # 系统配置页面
│
├── features/Admin/                # 业务逻辑和 UI 组件
│   ├── Layout/                    # 布局相关
│   │   ├── AdminGuard.tsx         # 权限守卫组件
│   │   ├── AdminSidebar.tsx       # 侧边栏组件
│   │   └── index.ts
│   ├── Dashboard/                 # 仪表盘
│   │   ├── StatCard.tsx           # 统计卡片
│   │   ├── RecentUsers.tsx        # 最近用户
│   │   ├── RecentWorkspaces.tsx   # 最近工作区
│   │   └── index.tsx
│   ├── Users/                     # 用户管理
│   │   ├── UserList.tsx           # 用户列表表格
│   │   ├── UserForm.tsx           # 创建/编辑用户表单
│   │   ├── UserRolePanel.tsx      # 角色分配面板
│   │   ├── UserDetail.tsx         # 用户详情
│   │   └── index.ts
│   ├── Roles/                     # 角色管理
│   │   ├── RoleList.tsx           # 角色列表表格
│   │   ├── RoleForm.tsx           # 创建/编辑角色表单
│   │   ├── RolePermissionPanel.tsx # 权限配置面板
│   │   └── index.ts
│   ├── Permissions/               # 权限管理
│   │   ├── PermissionList.tsx     # 权限列表表格
│   │   └── index.ts
│   ├── Workspaces/                # 工作区管理
│   │   ├── WorkspaceList.tsx      # 工作区列表
│   │   ├── WorkspaceDetail.tsx    # 工作区详情
│   │   └── index.ts
│   ├── Agents/                    # Agent 管理
│   │   ├── AgentList.tsx          # Agent 列表
│   │   └── index.ts
│   ├── Messages/                  # 消息管理
│   │   ├── MessageList.tsx        # 消息列表
│   │   ├── MessageDetail.tsx      # 消息详情
│   │   └── index.ts
│   ├── Files/                     # 文件管理
│   │   ├── FileList.tsx           # 文件列表
│   │   └── index.ts
│   ├── KnowledgeBases/            # 知识库管理
│   │   ├── KnowledgeBaseList.tsx  # 知识库列表
│   │   └── index.ts
│   ├── Models/                    # 模型管理
│   │   ├── ModelList.tsx          # 模型列表
│   │   └── index.ts
│   ├── Providers/                 # 供应商管理
│   │   ├── ProviderList.tsx       # 供应商列表
│   │   └── index.ts
│   ├── ApiKeys/                   # API Key 管理
│   │   ├── ApiKeyList.tsx         # API Key 列表
│   │   └── index.ts
│   ├── AuditLogs/                 # 审计日志
│   │   ├── AuditLogList.tsx       # 审计日志列表
│   │   └── index.ts
│   ├── Settings/                  # 系统配置
│   │   ├── SystemSettings.tsx     # 系统配置表单
│   │   └── index.ts
│   └── common/                    # 共享组件
│       ├── AdminTable.tsx         # 通用管理表格封装
│       ├── AdminSearch.tsx        # 通用搜索栏
│       ├── PageHeader.tsx         # 页面头部
│       ├── StatusTag.tsx          # 状态标签
│       └── index.ts
│
├── services/admin/                 # API Service 层
│   ├── base.ts                    # 基础 HTTP 客户端配置
│   ├── dashboard.ts               # 仪表盘聚合数据
│   ├── users.ts                   # 用户相关 API
│   ├── roles.ts                   # 角色相关 API
│   ├── permissions.ts             # 权限相关 API
│   ├── workspaces.ts              # 工作区相关 API
│   ├── agents.ts                  # Agent 相关 API
│   ├── messages.ts                # 消息相关 API
│   ├── files.ts                   # 文件相关 API
│   ├── knowledge-bases.ts         # 知识库相关 API
│   ├── models.ts                  # 模型相关 API
│   ├── providers.ts               # 供应商相关 API
│   ├── api-keys.ts                # API Key 相关 API
│   ├── audit-logs.ts              # 审计日志相关 API
│   └── settings.ts                # 系统配置相关 API
│
├── locales/default/
│   └── admin.ts                   # 管理后台国际化资源
│
└── spa/router/
    ├── desktopRouter.config.tsx       # 更新路由配置
    └── desktopRouter.config.desktop.tsx  # 同步更新
```

### 5.3 布局设计

```
┌─────────────────────────────────────────────────────────────┐
│  管理后台 Header                                             │
│  ← 返回主站  |  管理后台  |  面包屑: 用户管理 > 用户列表       │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│  侧边栏   │  内容区                                           │
│          │                                                   │
│  📊 仪表盘│  ┌─────────────────────────────────────────────┐ │
│  👥 用户  │  │  页面标题 + 操作按钮                          │ │
│  🔐 角色  │  │  ┌──────────────────────────────────────┐  │ │
│  🛡️ 权限  │  │  │  搜索栏 + 筛选 + 创建按钮              │  │ │
│  🏢 工作区│  │  ├──────────────────────────────────────┤  │ │
│  🤖 Agent│  │  │  antd Table / ProTable                │  │ │
│  💬 消息  │  │  │  ┌────┬────┬────┬────┬────┬────┐     │  │ │
│  📁 文件  │  │  │  │ 列1 │ 列2 │ 列3 │ 列4 │ 列5 │ 操作│  │ │ │
│  📚 知识库│  │  │  ├────┼────┼────┼────┼────┼────┤     │  │ │
│  🧠 模型  │  │  │  │ .. │ .. │ .. │ .. │ .. │ .. │     │  │ │
│  🏪 供应商│  │  │  └────┴────┴────┴────┴────┴────┘     │  │ │
│  🔑 API  │  │  ├──────────────────────────────────────┤  │ │
│  📋 审计  │  │  │  分页器                              │  │ │
│  ⚙️ 配置  │  │  └──────────────────────────────────────┘  │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 5.4 侧边栏导航定义

```typescript
// 参考 settings 页面的 routeMeta.ts 模式
const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: '仪表盘' },
  { type: 'divider' },
  { group: '系统管理' },
  { path: '/admin/users', icon: Users, label: '用户管理' },
  { path: '/admin/roles', icon: Shield, label: '角色管理' },
  { path: '/admin/permissions', icon: Key, label: '权限管理' },
  { type: 'divider' },
  { group: '资源管理' },
  { path: '/admin/workspaces', icon: Building2, label: '工作区管理' },
  { path: '/admin/agents', icon: Bot, label: 'Agent 管理' },
  { path: '/admin/messages', icon: MessageSquare, label: '消息管理' },
  { path: '/admin/files', icon: FileText, label: '文件管理' },
  { path: '/admin/knowledge-bases', icon: Library, label: '知识库管理' },
  { type: 'divider' },
  { group: 'AI 管理' },
  { path: '/admin/models', icon: Cpu, label: '模型管理' },
  { path: '/admin/providers', icon: Server, label: '供应商管理' },
  { path: '/admin/api-keys', icon: KeyRound, label: 'API Key 管理' },
  { type: 'divider' },
  { group: '运维管理' },
  { path: '/admin/audit-logs', icon: ScrollText, label: '审计日志' },
  { path: '/admin/settings', icon: Settings, label: '系统配置' },
];
```

---

## 六、开发优先级

### 第一批：基础框架 + 核心管理（4 天）

| 序号 | 任务 | 工作量 | 交付物 |
|------|------|--------|--------|
| 1 | 路由配置 + 布局 | 0.5 天 | `RESERVED_FIRST_SEGMENTS` 更新、路由配置、Layout 组件 |
| 2 | 用户管理 | 1.5 天 | 用户列表 + 创建/编辑/删除 + 角色分配 |
| 3 | 用户详情 | 0.5 天 | 用户详情展示 + 角色管理面板 |
| 4 | 角色管理 | 1 天 | 角色列表 + 创建/编辑 + 权限绑定 |
| 5 | 权限管理 | 0.5 天 | 权限列表展示 |

### 第二批：资源管理（2 天）

| 序号 | 任务 | 工作量 | 交付物 |
|------|------|--------|--------|
| 6 | 工作区管理 | 1 天 | 工作区列表 + 冻结/解冻/删除 |
| 7 | Agent 管理 | 0.5 天 | Agent 列表 + 查看/删除 |
| 8 | 模型管理 | 0.5 天 | 模型列表 + 启用/禁用/编辑 |
| 9 | 供应商管理 | 0.5 天 | 供应商列表 + 启用/禁用/编辑 |

### 第三批：数据管理（2 天）

| 序号 | 任务 | 工作量 | 交付物 |
|------|------|--------|--------|
| 10 | 消息管理 | 0.5 天 | 消息列表 + 搜索/详情/删除 |
| 11 | 文件管理 | 0.5 天 | 文件列表 + 管理/删除 |
| 12 | 知识库管理 | 0.5 天 | 知识库列表 + 创建/编辑/删除 |
| 13 | API Key 管理 | 0.5 天 | API Key 列表 + 创建/撤销 |

### 第四批：扩展功能（2.5 天）

| 序号 | 任务 | 工作量 | 交付物 | 前置条件 |
|------|------|--------|--------|---------|
| 14 | 仪表盘 | 1 天 | 统计卡片 + 趋势图 + 快速入口 | — |
| 15 | 审计日志 | 0.5 天 | 日志列表 + 搜索 + 过滤 | 需先补充后端 `workspaceAuditLogRouter` |
| 16 | 系统配置 | 1 天 | 配置表单 | 需先评估后端 `configRouter` |

---

## 七、技术规范

### 7.1 代码规范

| 规范 | 规则 |
|------|------|
| **组件命名** | PascalCase |
| **函数/变量** | camelCase |
| **文件命名** | kebab-case（React 组件文件使用 PascalCase） |
| **组件组织** | 每个模块在 `features/Admin/<Module>/` 下，导出 `index.ts` |
| **API 调用** | 通过 `services/admin/` Service 层封装，不在组件中直接调用 tRPC/OpenAPI |
| **样式方案** | 优先使用 `@lobehub/ui` 的 `createStaticStyles`，回退到 `antd-style` 的 `createStyles` |
| **路由文件** | 只做导入组合，不包含业务逻辑 |

### 7.2 国际化

新建 `src/locales/default/admin.ts`：

```typescript
export default {
  'admin.title': '管理后台',
  // 导航
  'admin.nav.dashboard': '仪表盘',
  'admin.nav.users': '用户管理',
  'admin.nav.roles': '角色管理',
  'admin.nav.permissions': '权限管理',
  'admin.nav.workspaces': '工作区管理',
  'admin.nav.agents': 'Agent 管理',
  'admin.nav.messages': '消息管理',
  'admin.nav.files': '文件管理',
  'admin.nav.knowledgeBases': '知识库管理',
  'admin.nav.models': '模型管理',
  'admin.nav.providers': '供应商管理',
  'admin.nav.apiKeys': 'API Key 管理',
  'admin.nav.auditLogs': '审计日志',
  'admin.nav.settings': '系统配置',
  // 通用操作
  'admin.actions.create': '创建',
  'admin.actions.edit': '编辑',
  'admin.actions.delete': '删除',
  'admin.actions.confirm': '确认',
  'admin.actions.cancel': '取消',
  'admin.actions.save': '保存',
  'admin.actions.search': '搜索',
  // 用户管理
  'admin.users.title': '用户管理',
  'admin.users.create': '创建用户',
  'admin.users.edit': '编辑用户',
  'admin.users.delete': '删除用户',
  'admin.users.confirmDelete': '确定要删除该用户吗？此操作不可恢复。',
  // 角色管理
  'admin.roles.title': '角色管理',
  'admin.roles.create': '创建角色',
  'admin.roles.edit': '编辑角色',
  'admin.roles.confirmDelete': '确定要删除该角色吗？',
  // ... 按模块继续
};
```

### 7.3 权限控制

```typescript
// 管理后台入口权限守卫
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useUserRoles();
  if (isLoading) return <Spin />;
  if (!isSuperAdmin) return <Result status="403" title="403" subTitle="无权限访问管理后台" />;
  return <>{children}</>;
}

// 子页面权限
function AdminUsersPage() {
  const { allowed, reason } = usePermission('user:read');
  if (!allowed) return <Result status="403" title="无权限" subTitle={reason} />;
  return <UserList />;
}
```

### 7.4 错误处理

| 场景 | 处理方式 |
|------|---------|
| API 请求失败 | antd `message.error()` / `notification.error()` |
| 网络错误 | 统一的错误提示 "网络连接失败，请稍后重试" |
| 权限不足 | `Result status="403"` 页面 |
| 页面不存在 | `Result status="404"` 页面 |
| 加载中 | `Skeleton` / `Spin` 组件 |
| 空数据 | `Empty` 组件 |
| 表单校验 | antd Form 内置校验 + 自定义校验规则 |
| 全局异常 | ErrorBoundary 包裹 |

### 7.5 样式规范

```typescript
// 优先使用 createStaticStyles（零运行时）
import { createStaticStyles } from '@lobehub/ui';

const { styles, cssVar } = createStaticStyles({
  adminContainer: cssVar({
    padding: 24,
    background: 'backgroundSecondary',
  }),
  pageHeader: cssVar({
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 600,
  }),
});

// 回退到 createStyles
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  tableWrapper: css`
    .ant-table { border-radius: ${token.borderRadius}px; }
  `,
}));
```

---

## 八、风险与注意事项

### 8.1 后端缺失功能

| 功能 | 风险等级 | 说明 | 影响 |
|------|---------|------|------|
| 审计日志 | **高** | `workspaceAuditLogRouter` 为空壳 `router({})` | 审计日志页面无法开发，需先补充后端 |
| 系统配置 | **中** | `configRouter` 和 `businessConfigEndpoints` 需评估 | 系统配置页面可能延后 |
| 部分 tRPC Router | **低** | accountDeletion、referral、subscription 等为空壳 | 不影响核心管理功能 |
| 工作区 OpenAPI | **低** | 无公开 OpenAPI 路由，需使用 tRPC | 工作区管理页面正常工作 |

### 8.2 权限控制

- **前端**：通过 `useUserRoles().isSuperAdmin` 判断是否可访问管理后台，仅做 UI 层级的隐藏/禁用
- **后端**：始终有完整的权限中间件检查，前端绕过不影响安全性
- **管理后台专用权限**：目前 `usePermission` hook 的语义 action 不包含 `admin:*` 级别，管理后台入口使用 `isSuperAdmin` 判断

### 8.3 UI/UX 注意事项

- 所有列表页面必须支持后端分页
- 所有操作必须有加载状态反馈（Loading / Spin）
- 删除操作必须有 `Popconfirm` 二次确认
- 危险操作（删除、封禁）用红色按钮
- 表单必须有校验提示
- 长文本内容需截断 + Tooltip 显示完整内容
- 空数据状态需有 `Empty` 组件提示

### 8.4 与现有系统的兼容性

- **URL 冲突**：`admin` 必须加入 `RESERVED_FIRST_SEGMENTS`，避免被识别为 workspace slug
- **布局兼容**：管理后台布局独立于主应用布局，退出后正常访问主应用
- **路由同步**：`desktopRouter.config.tsx` 和 `desktopRouter.config.desktop.tsx` 必须同步更新
- **无副作用**：管理后台不修改现有业务逻辑，只新增文件

---

## 九、实施步骤

### Step 1：基础框架搭建（0.5 天）

1. 在 `src/features/Workspace/useWorkspaceUrlSync.ts` 的 `RESERVED_FIRST_SEGMENTS` 中添加 `'admin'`
2. 在 `desktopRouter.config.tsx` 和 `desktopRouter.config.desktop.tsx` 中配置 `/admin/*` 路由
3. 创建 `src/routes/(main)/admin/_layout/index.tsx` 布局组件
4. 创建 `src/features/Admin/Layout/AdminGuard.tsx` 权限守卫
5. 创建 `src/features/Admin/common/` 公共组件（AdminTable, AdminSearch 等）

### Step 2：用户管理（2 天）

1. 创建 `src/services/admin/users.ts` — 封装用户相关 API
2. 创建 `src/features/Admin/Users/UserList.tsx` — 用户列表表格
3. 创建 `src/features/Admin/Users/UserForm.tsx` — 创建/编辑用户表单
4. 创建 `src/features/Admin/Users/UserRolePanel.tsx` — 角色分配面板
5. 创建 `src/features/Admin/Users/UserDetail.tsx` — 用户详情
6. 创建 `src/routes/(main)/admin/users/index.tsx` 和 `[id].tsx` 路由文件

### Step 3：角色和权限管理（1.5 天）

1. 创建 `src/services/admin/roles.ts` 和 `permissions.ts`
2. 创建 `src/features/Admin/Roles/RoleList.tsx`、`RoleForm.tsx`、`RolePermissionPanel.tsx`
3. 创建 `src/features/Admin/Permissions/PermissionList.tsx`
4. 创建路由文件

### Step 4：资源管理（2 天）

1. 创建 services：`workspaces.ts`、`agents.ts`、`models.ts`、`providers.ts`
2. 创建各模块的 List/Form/Detail 组件
3. 创建路由文件

### Step 5：数据管理（2 天）

1. 创建 services：`messages.ts`、`files.ts`、`knowledge-bases.ts`、`api-keys.ts`
2. 创建各模块的 List/Form/Detail 组件
3. 创建路由文件

### Step 6：扩展功能（2.5 天）

1. 创建 `dashboard.ts` service + 仪表盘组件
2. 创建 `audit-logs.ts` service + 审计日志组件（后端补充后）
3. 创建 `settings.ts` service + 系统配置组件（后端评估后）

### Step 7：国际化 + 优化（0.5 天）

1. 完善 `admin.ts` 语言文件（中英文双份）
2. TypeScript 编译检查（`bun run type-check`）
3. 功能测试
4. 权限测试

---

## 十、总结

### 核心优势

1. **零后端开发**：15 个管理页面中，13 个页面的后端 API 已完备，可直接调用
2. **无第三方依赖**：全部在 LobeHub 源码内开发，与主线同步更新
3. **权限完备**：RBAC 权限系统已支持前端 hook 和后端中间件，开箱即用
4. **复用现有架构**：tRPC client、@lobehub/ui、antd 全部已安装配置
5. **分步实施**：4 批开发，总计约 10.5 天工作量，可快速交付核心功能
6. **完整数据映射**：每个管理页面都有明确的数据来源和数据库表映射

### 需要补充的后端功能

1. **审计日志**：`workspaceAuditLogRouter` 需补充 `listLogs`、`searchLogs`、`getLogById` 等 procedures
2. **系统配置**：需评估 `configRouter` 的可用配置项，或补充新的配置 endpoints

### 待确认事项

1. **路由路径**：是否使用 `/admin/*` 作为管理后台的路径？
2. **权限控制**：是否只有 `super_admin` 角色可以访问管理后台？
3. **页面优先级**：是否按照上述 4 批开发优先级执行？
4. **UI 风格**：是否复用现有 settings 页面的 UI 风格（侧边栏 + 内容区）？
5. **审计日志**：是否先跳过，等后端补充后再开发？
6. **系统配置**：是否先跳过，等后端评估后再开发？
