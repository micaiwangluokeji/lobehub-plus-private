# LobeHub 管理后台（/admin/*）完整规划文档

## 一、背景与目标

### 1.1 现状问题

LobeHub 目前存在以下问题：

1. **无完整管理后台**：只有用户自服务的 `/settings/*` 页面，缺少系统级管理界面
2. **后端 API 已完备但无前端**：OpenAPI（13 个路由）+ tRPC（70+ router）覆盖所有管理需求，但无对应 UI
3. **升级维护困难**：如果依赖第三方（如 NocoBase）做管理后台，数据库 schema 更新时无法同步

### 1.2 目标

在 LobeHub 源码内新增 `/admin/*` 路由，开发完整的管理后台前端 UI，实现：

- 用户管理（列表/搜索/创建/编辑/删除/角色分配）
- 角色管理（列表/创建/编辑/删除/权限绑定）
- 权限管理（列表/查看）
- 工作区管理（列表/冻结/删除）
- Agent 管理（列表/编辑/删除）
- 消息管理（查看/搜索/删除）
- 文件管理（查看/删除）
- 知识库管理（查看/删除）
- 模型管理（查看/编辑/删除）
- 供应商管理（查看/编辑/删除）
- API Key 管理（查看/创建/删除/启用禁用）
- 审计日志（查看）
- 系统配置（查看/编辑）
- 系统仪表盘（概览统计）

### 1.3 核心原则

1. **只写前端 UI**：所有后端 API 已完备，不需要修改后端代码
2. **与主线同步**：在 LobeHub 源码内开发，随主版本更新
3. **复用现有架构**：复用 tRPC client、RBAC 权限、UI 组件库
4. **权限控制**：只有 `super_admin` 角色可访问

---

## 二、现有资源调研

### 2.1 后端 API 能力

#### OpenAPI REST（`/api/v1/*`）

| 路由 | 完整 CRUD | 说明 |
|------|:---------:|------|
| `users` | ✅ | 用户管理（增删改查 + 角色分配 + 搜索） |
| `roles` | ✅ | 角色管理（增删改查 + 权限绑定） |
| `permissions` | ✅ | 权限管理（增删改查） |
| `agents` | ✅ | Agent 管理（增删改查） |
| `agent-groups` | ✅ | Agent 分组管理（增删改查） |
| `messages` | ✅ | 消息管理（增删改查 + 搜索 + 批量删除） |
| `topics` | ✅ | 会话管理（增删改查 + 分页） |
| `models` | ✅ | 模型管理（增删改查 + 分页） |
| `providers` | ✅ | 供应商管理（增删改查） |
| `files` | ✅ | 文件管理（增删改查 + 上传 + 分片 + 解析） |
| `knowledge-bases` | ✅ | 知识库管理（增删改查） |
| `message-translations` | ✅ | 消息翻译管理（增删改查） |
| `responses` | ✅ | AI 响应生成 |

#### tRPC Lambda Router

已在 `apps/server/src/routers/lambda/` 和 `packages/business-server/src/lambda-routers/` 中定义：

- `user` — 用户状态、设置、偏好
- `apiKey` — API Key CRUD
- `aiAgent` — Agent 业务逻辑
- `aiModel` — 模型管理
- `aiProvider` — 供应商管理
- `agent` — Agent CRUD
- `agentGroup` — Agent 分组
- `message` — 消息 CRUD
- `topic` — 会话 CRUD
- `session` — 会话 CRUD
- `file` — 文件 CRUD
- `knowledgeBase` — 知识库 CRUD
- `workspace` — 工作区 CRUD（list/create/update/delete/getBySlug）
- `workspaceMember` — 成员管理（list/invite/remove/updateRole）
- `workspaceAuditLog` — 审计日志（**目前是空壳** `router({})`）
- `workspaceCredits` — 额度管理
- `workspaceUsage` — 用量管理
- `market.creds` — 凭据管理
- `config` — 配置管理
- `notification` — 通知管理
- `device` — 设备管理

### 2.2 RBAC 权限系统

#### 全局角色（3 个）

| 角色 | 权限范围 | 说明 |
|------|----------|------|
| `super_admin` | **所有权限** | 系统管理员，拥有全部权限 |
| `vip_user` | 创建/读取全局，管理自己的资源 | VIP 用户 |
| `free_user` | 仅管理自己安装的 Agent | 免费用户 |

#### 工作区角色（3 个）

| 角色 | 权限范围 |
|------|----------|
| `workspace_owner` | 工作区全部权限（含成员、账单、审计、自定义角色） |
| `workspace_member` | 读共享资源 + 管理自己的内容 |
| `workspace_viewer` | 严格只读 |

#### 权限粒度（46 种 action × 2 种 scope）

```
agent:read:all          agent:read:owner
agent:create:all        agent:create:owner
user:read:all           user:read:owner
message:read:all        message:read:owner
rbac:role_create:all   (RBAC 只有 :all，无 :owner)
...共 46 种 action
```

### 2.3 数据库 Schema

关键管理表（已在 `packages/database/src/schemas/` 中定义）：

| 表 | 用途 | 关键字段 |
|----|------|----------|
| `users` | 用户 | id, email, username, banned, banReason, role |
| `workspaces` | 工作区 | id, slug, name, frozen, frozenReason |
| `workspace_members` | 工作区成员 | workspaceId, userId, role, joinedAt |
| `workspace_invitations` | 工作区邀请 | email, token, status, expiresAt |
| `workspace_audit_logs` | 审计日志 | userId, action, resourceType, metadata |
| `rbac_roles` | 角色 | name, displayName, isSystem, workspaceId |
| `rbac_permissions` | 权限 | code, name, category |
| `rbac_role_permissions` | 角色-权限关联 | roleId, permissionId |
| `rbac_user_roles` | 用户-角色关联 | userId, roleId, workspaceId, expiresAt |
| `api_key` | API Key | key, userId, enabled, expiresAt |
| `agents` | Agent | id, userId, workspaceId, model, provider |
| `sessions` | 会话 | id, userId, workspaceId, type |
| `messages` | 消息 | id, sessionId, userId |
| `files` | 文件 | id, userId, knowledgeBaseId |
| `knowledge_bases` | 知识库 | id, userId, workspaceId |

### 2.4 前端现有资源

#### UI 组件库

- `@lobehub/ui` — LobeHub 自研组件库
- `antd` — Ant Design 组件库
- `ProTable` — 已在 `/settings/apikey` 页面使用，适合管理后台表格

#### 路由配置

- 文件：`src/spa/router/desktopRouter.config.tsx`
- 个人版设置：`/settings/*`（第 731-798 行）
- 工作区设置：`/:workspaceSlug/settings/*`（第 803-938 行）
- `RESERVED_FIRST_SEGMENTS`：在 `src/features/Workspace/useWorkspaceUrlSync.ts` 第 19-39 行定义

#### 权限控制

- `usePermission` hook — 前端权限检查
- `withScopedPermission` 中间件 — tRPC 权限控制
- `SettingsTabs` 枚举 — 在 `src/store/global/initialState.ts` 第 42-80 行定义

---

## 三、技术方案

### 3.1 路由设计

#### 3.1.1 添加 `admin` 到 `RESERVED_FIRST_SEGMENTS`

修改 `src/features/Workspace/useWorkspaceUrlSync.ts` 第 19-39 行：

```typescript
const RESERVED_FIRST_SEGMENTS = new Set([
  // Shared (mirrored under /:workspaceSlug too):
  'agent',
  'group',
  'community',
  'memory',
  'page',
  'resource',
  'image',
  'video',
  'eval',
  'tasks',
  'task',
  // Personal-only:
  'settings',
  'onboarding',
  'me',
  'share',
  'devtools',
  'desktop-onboarding',
  // Admin:
  'admin',  // ← 新增
]);
```

#### 3.1.2 路由配置

在 `src/spa/router/desktopRouter.config.tsx` 的 `desktopRoutes` 中添加（在 `settings` 路由之前）：

```typescript
// Admin routes (personal-only — never mirrored under /:workspaceSlug)
{
  children: [
    {
      element: redirectElement('/admin/dashboard'),
      index: true,
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/dashboard'),
        'Desktop > Admin > Dashboard',
      ),
      path: 'dashboard',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/users'),
        'Desktop > Admin > Users',
      ),
      path: 'users',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/users/[id]'),
        'Desktop > Admin > User Detail',
      ),
      path: 'users/:id',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/roles'),
        'Desktop > Admin > Roles',
      ),
      path: 'roles',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/permissions'),
        'Desktop > Admin > Permissions',
      ),
      path: 'permissions',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/workspaces'),
        'Desktop > Admin > Workspaces',
      ),
      path: 'workspaces',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/agents'),
        'Desktop > Admin > Agents',
      ),
      path: 'agents',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/messages'),
        'Desktop > Admin > Messages',
      ),
      path: 'messages',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/files'),
        'Desktop > Admin > Files',
      ),
      path: 'files',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/knowledge-bases'),
        'Desktop > Admin > Knowledge Bases',
      ),
      path: 'knowledge-bases',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/models'),
        'Desktop > Admin > Models',
      ),
      path: 'models',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/providers'),
        'Desktop > Admin > Providers',
      ),
      path: 'providers',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/api-keys'),
        'Desktop > Admin > API Keys',
      ),
      path: 'api-keys',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/audit-logs'),
        'Desktop > Admin > Audit Logs',
      ),
      path: 'audit-logs',
    },
    {
      element: dynamicElement(
        () => import('@/routes/(main)/admin/settings'),
        'Desktop > Admin > Settings',
      ),
      path: 'settings',
    },
  ],
  element: dynamicElement(
    () => import('@/routes/(main)/admin/_layout'),
    'Desktop > Admin > Layout',
  ),
  errorElement: <ErrorBoundary />,
  path: 'admin',
},
```

### 3.2 页面结构设计

#### 3.2.1 目录结构

```
src/routes/(main)/admin/
├── _layout/
│   ├── index.tsx           # 管理后台布局（侧边栏 + 内容区）
│   ├── Sidebar.tsx         # 侧边栏组件
│   ├── SidebarContent.tsx  # 侧边栏内容
│   ├── Header.tsx          # 顶部标题
│   ├── style.ts            # 样式
│   └── ContextProvider.tsx # 上下文 Provider
├── dashboard/
│   └── index.tsx           # 系统仪表盘
├── users/
│   ├── index.tsx           # 用户列表
│   └── [id]/
│       └── index.tsx       # 用户详情 + 角色分配
├── roles/
│   └── index.tsx           # 角色列表 + 权限绑定
├── permissions/
│   └── index.tsx           # 权限列表
├── workspaces/
│   └── index.tsx           # 工作区列表
├── agents/
│   └── index.tsx           # Agent 列表
├── messages/
│   └── index.tsx           # 消息列表
├── files/
│   └── index.tsx           # 文件列表
├── knowledge-bases/
│   └── index.tsx           # 知识库列表
├── models/
│   └── index.tsx           # 模型列表
├── providers/
│   └── index.tsx           # 供应商列表
├── api-keys/
│   └── index.tsx           # API Key 列表（可复用现有 settings/apikey）
├── audit-logs/
│   └── index.tsx           # 审计日志
└── settings/
    └── index.tsx           # 系统配置
```

#### 3.2.2 布局设计

参考现有 `/settings/*` 的布局（`src/routes/(main)/settings/_layout/`）：

```typescript
// src/routes/(main)/admin/_layout/index.tsx
const Layout: FC = () => {
  return (
    <AdminContextProvider value={{ /* 管理后台上下文 */ }}>
      <SideBar />
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
    </AdminContextProvider>
  );
};
```

侧边栏导航项：

| 图标 | 标签 | 路由 |
|------|------|------|
| BarChart3 | 仪表盘 | `/admin/dashboard` |
| Users | 用户管理 | `/admin/users` |
| Shield | 角色管理 | `/admin/roles` |
| Key | 权限管理 | `/admin/permissions` |
| Building2 | 工作区管理 | `/admin/workspaces` |
| Bot | Agent 管理 | `/admin/agents` |
| MessageSquare | 消息管理 | `/admin/messages` |
| File | 文件管理 | `/admin/files` |
| Database | 知识库管理 | `/admin/knowledge-bases` |
| Cpu | 模型管理 | `/admin/models` |
| Server | 供应商管理 | `/admin/providers` |
| KeyRound | API Key 管理 | `/admin/api-keys` |
| ClipboardList | 审计日志 | `/admin/audit-logs` |
| Settings | 系统配置 | `/admin/settings` |

### 3.3 API 调用方式

#### 3.3.1 使用 tRPC Client

复用现有的 `lambdaClient`（和现有 settings 页面一样的模式）：

```typescript
// 用户管理
import { lambdaClient } from '@/libs/trpc/client';

// 获取用户列表
const { data, isLoading } = useQuery(
  ['admin', 'users', page, pageSize],
  () => lambdaClient.user.list.query({ page, pageSize })
);

// 获取用户详情
const { data: user } = useQuery(
  ['admin', 'users', id],
  () => lambdaClient.user.getUserState.query({ userId: id })
);

// 更新用户信息
const mutation = useMutation(
  (params) => lambdaClient.user.update.mutate(params)
);
```

#### 3.3.2 使用 OpenAPI（备选）

如果 tRPC router 缺少某些管理接口，可以直接调用 OpenAPI：

```typescript
// 用户管理（OpenAPI）
const response = await fetch('/api/v1/users?page=1&pageSize=20', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

### 3.4 权限控制

#### 3.4.1 前端权限检查

在管理后台布局层统一检查权限：

```typescript
// src/routes/(main)/admin/_layout/index.tsx
import { usePermission } from '@/hooks/usePermission';

const Layout: FC = () => {
  const { allowed } = usePermission('user:read:all'); // super_admin 才有的权限
  
  if (!allowed) {
    return <NoPermission />;
  }
  
  return (
    <AdminContextProvider value={{}}>
      <SideBar />
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
    </AdminContextProvider>
  );
};
```

#### 3.4.2 tRPC 权限中间件

后端已经在 `packages/business-server/src/trpc-middlewares/rbacPermission.ts` 中实现了 `withScopedPermission` 中间件，管理后台的 tRPC router 可以直接复用。

---

## 四、页面开发详细规划

### 4.1 仪表盘（`/admin/dashboard`）

**功能**：系统概览统计

**数据来源**：
- `lambdaClient.user.count.query()` — 用户总数
- `lambdaClient.workspace.list.query()` — 工作区总数
- `lambdaClient.agent.list.query()` — Agent 总数
- `lambdaClient.message.count.query()` — 消息总数
- `lambdaClient.file.count.query()` — 文件总数

**UI 组件**：
- 统计卡片（用户数、工作区数、Agent 数、消息数、文件数）
- 近期活跃用户图表（可先用简单的列表）
- 系统状态指示器

**开发量**：高（需要设计仪表盘布局）

### 4.2 用户管理（`/admin/users`）

**功能**：用户列表/搜索/创建/编辑/删除

**数据来源**：
- `GET /api/v1/users` — 用户列表（分页、搜索）
- `POST /api/v1/users` — 创建用户
- `PUT /api/v1/users/:id` — 更新用户
- `DELETE /api/v1/users/:id` — 删除用户
- `PUT /api/v1/users/:id/roles` — 分配角色

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 用户名 | `username` | 可编辑 |
| 邮箱 | `email` | 可编辑 |
| 角色 | `roles` | 显示角色标签，可编辑 |
| 状态 | `banned` | 启用/禁用开关 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 编辑/删除/查看详情 |

**UI 组件**：
- ProTable（参考 `/settings/apikey` 页面）
- 创建/编辑用户 Modal
- 角色分配 Dropdown
- 启用/禁用 Switch

**开发量**：中

### 4.3 用户详情（`/admin/users/:id`）

**功能**：用户详情 + 角色分配

**数据来源**：
- `GET /api/v1/users/:id` — 用户详情
- `GET /api/v1/roles` — 所有角色
- `PUT /api/v1/users/:id/roles` — 更新用户角色

**UI 组件**：
- 用户信息卡片（头像、用户名、邮箱、创建时间等）
- 角色管理面板（已分配角色、可分配角色）
- 用户权限列表

**开发量**：中

### 4.4 角色管理（`/admin/roles`）

**功能**：角色列表 + 权限绑定

**数据来源**：
- `GET /api/v1/roles` — 角色列表
- `POST /api/v1/roles` — 创建角色
- `PUT /api/v1/roles/:id` — 更新角色
- `DELETE /api/v1/roles/:id` — 删除角色
- `GET /api/v1/roles/:id/permissions` — 角色权限
- `PUT /api/v1/roles/:id/permissions` — 更新角色权限

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 角色名称 | `name` | 可编辑 |
| 显示名称 | `displayName` | 可编辑 |
| 是否系统角色 | `isSystem` | 只读（系统角色不可删除） |
| 权限数量 | `permissions.length` | 只读 |
| 操作 | — | 编辑/删除/管理权限 |

**UI 组件**：
- ProTable
- 创建/编辑角色 Modal
- 权限绑定 Drawer（右侧抽屉，显示权限树）

**开发量**：中

### 4.5 权限管理（`/admin/permissions`）

**功能**：权限列表（只读）

**数据来源**：
- `GET /api/v1/permissions` — 权限列表

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 权限代码 | `code` | 如 `user:read:all` |
| 权限名称 | `name` | 如 "读取所有用户" |
| 分类 | `category` | 如 "user", "agent", "rbac" |
| 描述 | `description` | 权限说明 |

**UI 组件**：
- ProTable（只读，无编辑操作）
- 按分类分组显示

**开发量**：低

### 4.6 工作区管理（`/admin/workspaces`）

**功能**：工作区列表/冻结/删除

**数据来源**：
- `lambdaClient.workspace.list.query()` — 工作区列表
- `lambdaClient.workspace.update.mutate()` — 更新工作区（冻结/解冻）
- `lambdaClient.workspace.delete.mutate()` — 删除工作区

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 工作区名称 | `name` | 可编辑 |
| Slug | `slug` | 只读 |
| 所有者 | `owner.username` | 只读 |
| 成员数 | `memberCount` | 只读 |
| 状态 | `frozen` | 冻结/解冻开关 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 查看详情/冻结/删除 |

**UI 组件**：
- ProTable
- 冻结/解冻 Confirm Modal
- 删除 Confirm Modal

**开发量**：中

### 4.7 Agent 管理（`/admin/agents`）

**功能**：Agent 列表/管理

**数据来源**：
- `GET /api/v1/agents` — Agent 列表
- `PUT /api/v1/agents/:id` — 更新 Agent
- `DELETE /api/v1/agents/:id` — 删除 Agent

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| Agent 名称 | `name` | 可编辑 |
| 所有者 | `userId` | 只读 |
| 工作区 | `workspaceId` | 只读 |
| 模型 | `model` | 只读 |
| 供应商 | `provider` | 只读 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 编辑/删除 |

**UI 组件**：
- ProTable
- 编辑 Agent Modal

**开发量**：中

### 4.8 消息管理（`/admin/messages`）

**功能**：消息查看/搜索/删除

**数据来源**：
- `GET /api/v1/messages` — 消息列表（分页、搜索）
- `DELETE /api/v1/messages/:id` — 删除消息

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 消息 ID | `id` | 只读 |
| 会话 ID | `sessionId` | 只读 |
| 用户 | `userId` | 只读 |
| 角色 | `role` | user/assistant/system |
| 内容预览 | `content` | 前 100 字符 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 查看完整内容/删除 |

**UI 组件**：
- ProTable
- 消息详情 Drawer
- 删除 Confirm Modal

**开发量**：中

### 4.9 文件管理（`/admin/files`）

**功能**：文件管理

**数据来源**：
- `GET /api/v1/files` — 文件列表
- `DELETE /api/v1/files/:id` — 删除文件

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 文件名 | `name` | 只读 |
| 所有者 | `userId` | 只读 |
| 知识库 | `knowledgeBaseId` | 只读 |
| 大小 | `size` | 只读 |
| 类型 | `type` | 只读 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 下载/删除 |

**UI 组件**：
- ProTable
- 文件预览 Drawer

**开发量**：中

### 4.10 知识库管理（`/admin/knowledge-bases`）

**功能**：知识库管理

**数据来源**：
- `GET /api/v1/knowledge-bases` — 知识库列表
- `DELETE /api/v1/knowledge-bases/:id` — 删除知识库

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 知识库名称 | `name` | 只读 |
| 所有者 | `userId` | 只读 |
| 工作区 | `workspaceId` | 只读 |
| 文件数 | `fileCount` | 只读 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 查看详情/删除 |

**UI 组件**：
- ProTable

**开发量**：低

### 4.11 模型管理（`/admin/models`）

**功能**：模型管理

**数据来源**：
- `GET /api/v1/models` — 模型列表
- `POST /api/v1/models` — 创建模型
- `PUT /api/v1/models/:id` — 更新模型
- `DELETE /api/v1/models/:id` — 删除模型

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 模型名称 | `name` | 可编辑 |
| 供应商 | `providerId` | 可编辑 |
| 启用状态 | `enabled` | 启用/禁用开关 |
| 上下文长度 | `contextWindow` | 只读 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 编辑/删除 |

**UI 组件**：
- ProTable
- 创建/编辑模型 Modal

**开发量**：中

### 4.12 供应商管理（`/admin/providers`）

**功能**：供应商管理

**数据来源**：
- `GET /api/v1/providers` — 供应商列表
- `POST /api/v1/providers` — 创建供应商
- `PUT /api/v1/providers/:id` — 更新供应商
- `DELETE /api/v1/providers/:id` — 删除供应商

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 供应商名称 | `name` | 可编辑 |
| 类型 | `type` | 只读 |
| 启用状态 | `enabled` | 启用/禁用开关 |
| 模型数 | `modelCount` | 只读 |
| 创建时间 | `createdAt` | 只读 |
| 操作 | — | 编辑/删除 |

**UI 组件**：
- ProTable
- 创建/编辑供应商 Modal

**开发量**：中

### 4.13 API Key 管理（`/admin/api-keys`）

**功能**：API Key 管理

**数据来源**：
- 可复用现有 `/settings/apikey` 页面的逻辑

**UI 组件**：
- 直接复用 `src/routes/(main)/settings/apikey/features/ApiKey.tsx`

**开发量**：低（复用现有组件）

### 4.14 审计日志（`/admin/audit-logs`）

**功能**：审计日志查看

**数据来源**：
- **目前 `workspaceAuditLogRouter` 是空壳**（`packages/business-server/src/lambda-routers/workspaceAuditLog.ts` 第 3 行 `router({})`）
- 需要补充实现后端逻辑

**表格列**：

| 列名 | 字段 | 说明 |
|------|------|------|
| 时间 | `createdAt` | 只读 |
| 用户 | `userId` | 只读 |
| 操作 | `action` | 只读 |
| 资源类型 | `resourceType` | 只读 |
| 资源 ID | `resourceId` | 只读 |
| 详情 | `metadata` | JSON 查看器 |

**UI 组件**：
- ProTable
- 详情 JSON Drawer

**开发量**：高（需要补充后端实现）

### 4.15 系统配置（`/admin/settings`）

**功能**：系统配置查看/编辑

**数据来源**：
- `lambdaClient.config.list.query()` — 配置列表
- `lambdaClient.config.update.mutate()` — 更新配置

**UI 组件**：
- ProTable
- 编辑配置 Modal

**开发量**：高（需要评估哪些配置可以通过 OpenAPI 管理）

---

## 五、开发优先级

### 第一批（核心功能，优先级最高）

1. **路由配置 + 布局** — 基础框架
2. **用户管理** — 最常用的功能
3. **角色管理** — 权限管理的基础
4. **权限管理** — 查看权限列表

### 第二批（常用功能）

5. **工作区管理** — 管理工作区
6. **Agent 管理** — 管理 Agent
7. **模型管理** — 管理模型
8. **供应商管理** — 管理供应商

### 第三批（辅助功能）

9. **消息管理** — 查看/删除消息
10. **文件管理** — 管理文件
11. **知识库管理** — 管理知识库
12. **API Key 管理** — 复用现有组件

### 第四批（高级功能）

13. **仪表盘** — 系统概览
14. **审计日志** — 需要补充后端
15. **系统配置** — 需要评估配置项

---

## 六、技术细节

### 6.1 样式方案

复用现有 settings 页面的样式方案（`@lobehub/ui` + `createStaticStyles`）：

```typescript
// src/routes/(main)/admin/_layout/style.ts
import { createStaticStyles } from '@lobehub/ui';

export const useStyles = createStaticStyles(({ cssVar }) => ({
  mainContainer: {
    // 复用 settings 页面的样式
  },
}));
```

### 6.2 国际化

添加 i18n 键值到 `src/locales/default/admin.ts`（新建）：

```typescript
// src/locales/default/admin.ts
export default {
  title: '管理后台',
  dashboard: '仪表盘',
  users: '用户管理',
  roles: '角色管理',
  permissions: '权限管理',
  workspaces: '工作区管理',
  agents: 'Agent 管理',
  messages: '消息管理',
  files: '文件管理',
  knowledgeBases: '知识库管理',
  models: '模型管理',
  providers: '供应商管理',
  apiKeys: 'API Key 管理',
  auditLogs: '审计日志',
  settings: '系统配置',
};
```

同步到 `locales/en-US/admin.ts` 和 `locales/zh-CN/admin.ts`。

### 6.3 类型定义

在 `packages/types/src/admin/` 下新建类型定义文件：

```typescript
// packages/types/src/admin/index.ts
export interface AdminDashboardStats {
  userCount: number;
  workspaceCount: number;
  agentCount: number;
  messageCount: number;
  fileCount: number;
}

export interface AdminUserListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  roles: string[];
  banned: boolean;
  createdAt: string;
}
```

---

## 七、风险与注意事项

### 7.1 后端缺失功能

1. **审计日志**：`workspaceAuditLogRouter` 是空壳，需要补充实现
2. **系统配置**：需要评估哪些配置可以通过 OpenAPI 管理
3. **批量操作**：某些批量操作（如批量删除用户）可能缺少 API

### 7.2 权限控制

1. **前端权限检查**：需要在管理后台布局层统一检查 `super_admin` 权限
2. **后端权限中间件**：需要确保管理后台的 tRPC router 都加上 `withScopedPermission` 中间件

### 7.3 UI/UX

1. **复用现有组件**：尽量复用 `@lobehub/ui` 和 antd 的组件，保持一致性
2. **响应式布局**：管理后台需要支持宽屏布局
3. **加载状态**：所有列表页面需要加载状态和空状态

### 7.4 测试

1. **TypeScript 编译**：每次修改后必须运行 `bun run type-check` 确保编译通过
2. **功能测试**：每个页面开发完成后需要手动测试 CRUD 操作
3. **权限测试**：确保非 `super_admin` 用户无法访问管理后台

---

## 八、实施步骤

### 步骤 1：基础框架

1. 修改 `src/features/Workspace/useWorkspaceUrlSync.ts`，添加 `admin` 到 `RESERVED_FIRST_SEGMENTS`
2. 在 `src/spa/router/desktopRouter.config.tsx` 中添加 `admin` 路由配置
3. 创建 `src/routes/(main)/admin/_layout/` 目录和布局组件
4. 创建 `src/routes/(main)/admin/dashboard/index.tsx`（占位页面）

### 步骤 2：用户管理

1. 创建 `src/routes/(main)/admin/users/index.tsx`（用户列表）
2. 创建 `src/routes/(main)/admin/users/[id]/index.tsx`（用户详情）
3. 实现用户列表的 ProTable
4. 实现用户详情页面

### 步骤 3：角色和权限管理

1. 创建 `src/routes/(main)/admin/roles/index.tsx`（角色列表）
2. 创建 `src/routes/(main)/admin/permissions/index.tsx`（权限列表）
3. 实现角色列表的 ProTable
4. 实现权限绑定 Drawer

### 步骤 4：工作区和 Agent 管理

1. 创建 `src/routes/(main)/admin/workspaces/index.tsx`（工作区列表）
2. 创建 `src/routes/(main)/admin/agents/index.tsx`（Agent 列表）
3. 实现工作区列表的 ProTable
4. 实现 Agent 列表的 ProTable

### 步骤 5：其他管理页面

1. 创建消息管理、文件管理、知识库管理、模型管理、供应商管理等页面
2. 复用现有 `settings/apikey` 页面到 `admin/api-keys`

### 步骤 6：高级功能

1. 实现仪表盘页面
2. 补充审计日志后端实现
3. 实现系统配置页面

### 步骤 7：测试和优化

1. 运行 `bun run type-check` 确保编译通过
2. 手动测试所有页面的 CRUD 操作
3. 测试权限控制
4. 优化 UI/UX

---

## 九、总结

本规划文档详细描述了在 LobeHub 源码内新增管理后台（`/admin/*`）的完整方案，包括：

1. **路由设计**：添加 `admin` 到保留路径，配置路由
2. **页面结构**：14 个管理页面，按功能分目录
3. **API 调用**：复用现有 tRPC client 和 OpenAPI
4. **权限控制**：只有 `super_admin` 可访问
5. **开发优先级**：分 4 批开发，核心功能优先
6. **技术细节**：样式、国际化、类型定义
7. **风险与注意事项**：后端缺失功能、权限控制、UI/UX、测试
8. **实施步骤**：7 个步骤，从基础框架到测试优化

**核心优势**：

1. ✅ 与 LobeHub 主版本同步更新，无第三方依赖
2. ✅ 零网络延迟，直接调 tRPC
3. ✅ 复用现有 RBAC 权限体系
4. ✅ 复用现有 UI 组件库
5. ✅ 部署架构不变（还是同一个 Next.js 应用）
6. ✅ 所有 CRUD 操作都有现成的 API（users, roles, permissions, agents 等）

**需要补充的后端功能**：

1. ⚠️ 审计日志（`workspaceAuditLogRouter` 是空壳）
2. ⚠️ 系统配置的 API（需要评估哪些配置可以通过 OpenAPI 管理）

---

## 十、待确认事项

请确认以下事项：

1. **路由路径**：是否使用 `/admin/*` 作为管理后台的路径？
2. **权限控制**：是否只有 `super_admin` 角色可以访问管理后台？
3. **页面优先级**：是否按照本文档的"开发优先级"分批开发？
4. **UI 风格**：是否复用现有 settings 页面的 UI 风格？
5. **审计日志**：是否需要补充后端实现？还是先跳过，后续再实现？
6. **系统配置**：是否需要实现系统配置页面？还是先跳过，后续再实现？

确认后，我将开始实施。
