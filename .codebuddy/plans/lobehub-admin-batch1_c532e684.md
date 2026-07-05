---
name: lobehub-admin-batch1
overview: 第一批开发：管理后台基础框架（路由+布局+权限守卫）+ 核心管理模块（用户管理、用户详情、角色管理、权限管理）+ Service 层 + i18n
design:
  architecture:
    framework: react
  styleKeywords:
    - Admin Dashboard
    - Minimalist
    - Table-heavy
    - Sidebar Layout
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1677FF"
      - "#4096FF"
      - "#69B1FF"
    background:
      - "#F5F5F5"
      - "#FFFFFF"
      - "#FAFAFA"
    text:
      - "#262626"
      - "#595959"
      - "#8C8C8C"
    functional:
      - "#52C41A"
      - "#FF4D4F"
      - "#FAAD14"
      - "#1677FF"
todos:
  - id: infrastructure
    content: 搭建基础框架：RESERVED_FIRST_SEGMENTS + 双路由配置 + AdminLayout(AdminGuard/AdminSidebar) + 通用组件(AdminTable/AdminSearch/PageHeader/StatusTag) + Service base + i18n admin.ts + 仪表盘占位页
    status: completed
  - id: user-management
    content: 实现用户管理：users service(OpenAPI CRUD) + UserList(搜索/分页/创建/编辑/删除) + UserForm + UserRolePanel + 用户列表路由
    status: completed
    dependencies:
      - infrastructure
  - id: user-detail
    content: 实现用户详情页：UserDetail(信息卡片/角色管理/账号操作) + [id]路由
    status: completed
    dependencies:
      - user-management
  - id: role-permission
    content: 实现角色和权限管理：roles/permissions service + RoleList + RoleForm + RolePermissionPanel + PermissionList + routes
    status: completed
    dependencies:
      - infrastructure
---

## 第一批开发任务

按照已确认的 PRD（.codebuddy/lobehub-admin-prd.md），执行管理后台第一批开发，包含以下内容：

1. **基础框架搭建**：路由配置、RESERVED_FIRST_SEGMENTS 注册、AdminLayout（侧边栏+内容区）、权限守卫 AdminGuard、通用组件（AdminTable/AdminSearch/PageHeader/StatusTag）、Service 基础层、国际化初始文件
2. **用户管理**：用户列表（搜索/分页/创建/编辑/删除）、用户角色分配面板
3. **用户详情**：用户信息展示卡片、角色管理、账号操作（编辑/封禁/删除）
4. **角色管理**：角色列表（创建/编辑/删除）、权限绑定面板
5. **权限管理**：权限列表展示（只读，分类筛选/搜索）

所有页面仅 `super_admin` 可访问，路径前缀 `/admin/*`，UI 风格复用 settings 侧边栏+内容区布局。

## 技术方案

### 技术栈

- 前端：React 19 + TypeScript + antd (Table/Form/Modal/Tag/Badge/Switch/Spin/Result) + @lobehub/ui (Flexbox/Icon) + antd-style (createStaticStyles)
- 状态/数据：react-i18next (国际化)、react-router-dom (路由)
- API 调用：OpenAPI REST (`/api/v1/*`) + tRPC (`@/libs/trpc/client` 的 `lambdaClient`)
- 权限：`useUserRoles()` hook 的 `isSuperAdmin`

### 实现策略

**路由设计**：admin 路由作为个人路由（personal-only），位置放在 settings 之后、workspaceSlug 之前。不加入 `sharedMainAreaChildren`（避免被工作区路径镜像）。两个 config 文件（`desktopRouter.config.tsx` 异步 + `desktopRouter.config.desktop.tsx` 同步）必须同步配置相同的路径结构。

**权限守卫**：AdminLayout 外层包裹 AdminGuard 组件，使用 `useUserRoles().isSuperAdmin` 判断。非 super_admin 显示 403 页面。

**布局设计**：复用 settings 侧边栏+内容区模式。侧边栏显示管理后台导航菜单（14 个页面入口），内容区通过 `<Outlet />` 渲染子页面。样式使用 `createStaticStyles`（零运行时）。

**Service 层**：

- OpenAPI 调用封装在 `services/admin/base.ts`（基础 fetch 封装，拼接 `/api/v1/` 前缀）
- tRPC 调用直接使用 `lambdaClient`（例如 `lambdaClient.workspace.list.query()`）
- 每个模块一个 Service 文件，使用 class 模式（参考 `src/services/rbac.ts`、`src/services/workspace.ts`）

**列表页面模式**：顶部搜索栏+操作按钮 -> antd Table（支持分页、列配置） -> 操作列（编辑/删除 Popconfirm）。

**国际化**：新建 `src/locales/default/admin.ts`，包含导航标题、页面标题、通用操作按钮、各模块专用文案。只写 en-US 源文件，zh-CN 后续补充。

### 实施注意事项

- **路由同步**：`desktopRouter.sync.test.tsx` 会自动校验两个 config 文件的路径和 meta 一致性。admin 路由需要在两个文件中完全匹配，否则测试失败。
- **性能**：所有列表使用后端分页（page/pageSize），避免前端全量加载。所有 API 调用使用 SWR 缓存（参考 useOnlyFetchOnceSWR 模式）或直接 fetch。
- **Blast Radius**：只新增文件，不修改现有业务逻辑。唯一修改的现有文件是 RESERVED_FIRST_SEGMENTS（2 处）和 desktopRoute config（2 处）。
- **路由文件薄层**：`src/routes/(main)/admin/*` 下的文件只做 import + compose，不包含业务逻辑。业务组件放在 `src/features/Admin/*` 下。

### 架构设计

```
src/spa/router/desktopRouter.config.tsx / .desktop.tsx
  └── path: 'admin'
       └── element: AdminLayout (AdminGuard + Sidebar + Outlet)
            ├── index         → AdminDashboard (第一批占位/重定向)
            ├── users         → AdminUsers (UserList)
            ├── users/:id     → AdminUserDetail (UserDetail)
            ├── roles         → AdminRoles (RoleList)
            └── permissions   → AdminPermissions (PermissionList)
```

数据流：

```
页面组件 → features/Admin/* 业务组件 → services/admin/* Service 层 → OpenAPI fetch / lambdaClient
```

### 目录结构

```
src/routes/(main)/admin/                    # 路由文件（薄层）
  ├── _layout/
  │   └── index.tsx                         # [NEW] 管理后台布局容器
  ├── index.tsx                             # [NEW] 仪表盘占位页面（空状态或重定向到 /admin/users）
  ├── users/
  │   ├── index.tsx                         # [NEW] 用户列表页面路由
  │   └── [id].tsx                          # [NEW] 用户详情页面路由
  ├── roles/
  │   └── index.tsx                         # [NEW] 角色管理页面路由
  └── permissions/
      └── index.tsx                         # [NEW] 权限管理页面路由

src/features/Admin/                         # 业务组件
  ├── Layout/
  │   ├── AdminGuard.tsx                    # [NEW] 权限守卫组件（isSuperAdmin 检查）
  │   ├── AdminSidebar.tsx                  # [NEW] 侧边栏导航组件
  │   └── index.ts                         # [NEW]
  ├── Users/
  │   ├── UserList.tsx                      # [NEW] 用户列表表格（搜索/分页/创建/编辑/删除）
  │   ├── UserForm.tsx                      # [NEW] 创建/编辑用户表单 Modal
  │   ├── UserRolePanel.tsx                 # [NEW] 用户角色分配面板 Modal
  │   ├── UserDetail.tsx                    # [NEW] 用户详情展示
  │   └── index.ts                         # [NEW]
  ├── Roles/
  │   ├── RoleList.tsx                      # [NEW] 角色列表表格
  │   ├── RoleForm.tsx                      # [NEW] 创建/编辑角色表单 Modal
  │   ├── RolePermissionPanel.tsx           # [NEW] 角色权限配置面板 Drawer
  │   └── index.ts                         # [NEW]
  ├── Permissions/
  │   ├── PermissionList.tsx                # [NEW] 权限列表表格（只读）
  │   └── index.ts                         # [NEW]
  └── common/                              # 共享组件
      ├── AdminTable.tsx                    # [NEW] 通用管理表格封装（antd Table + 分页）
      ├── AdminSearch.tsx                   # [NEW] 通用搜索栏
      ├── PageHeader.tsx                    # [NEW] 页面头部标题组件
      ├── StatusTag.tsx                     # [NEW] 状态标签（启用/禁用/封禁等）
      └── index.ts                         # [NEW]

src/services/admin/                         # API Service 层
  ├── base.ts                              # [NEW] 基础 HTTP 客户端（fetch 封装 + 错误处理）
  ├── users.ts                             # [NEW] 用户相关 OpenAPI 调用
  ├── roles.ts                             # [NEW] 角色相关 OpenAPI 调用
  └── permissions.ts                       # [NEW] 权限相关 OpenAPI 调用

src/locales/default/
  └── admin.ts                             # [NEW] 管理后台国际化资源

src/features/Workspace/
  └── useWorkspaceUrlSync.ts               # [MODIFY] RESERVED_FIRST_SEGMENTS 添加 'admin'

src/layout/GlobalProvider/
  └── useUserStateRedirect.ts              # [MODIFY] RESERVED_FIRST_SEGMENTS 添加 'admin'

src/spa/router/
  ├── desktopRouter.config.tsx             # [MODIFY] 添加 /admin/* 路由树
  └── desktopRouter.config.desktop.tsx     # [MODIFY] 添加 /admin/* 路由树（同步修改）
```

### 关键接口定义

```typescript
// src/services/admin/base.ts
// OpenAPI 基础请求封装
class AdminApiBase {
  protected baseUrl = '/api/v1';
  protected async request<T>(path: string, options?: RequestInit): Promise<T>;
  protected async get<T>(path: string, params?: Record<string, string>): Promise<T>;
  protected async post<T>(path: string, body?: unknown): Promise<T>;
  protected async patch<T>(path: string, body?: unknown): Promise<T>;
  protected async delete<T>(path: string): Promise<T>;
}

// OpenAPI 通用分页响应结构
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// src/features/Admin/Layout/AdminGuard.tsx
// AdminGuard 使用 useUserRoles().isSuperAdmin 判断
// 非 super_admin 显示 403 Result 页面
// loading 状态显示 Spin
```

## 设计风格

复用现有 settings 页面的 UI 风格：侧边栏导航 + 内容区布局。

### 布局结构

```
┌─────────────────────────────────────────────┐
│  管理后台 Header（面包屑：管理后台 > 页面名称）    │
├──────────┬──────────────────────────────────┤
│ 侧边栏    │  内容区                            │
│ (240px)   │  - PageHeader（标题+操作按钮）      │
│           │  - 搜索栏                          │
│           │  - antd Table / 表单/详情卡片       │
│           │  - 分页器                          │
└──────────┴──────────────────────────────────┘
```

### 页面规划（第一批）

- **/admin/**：仪表盘占位页，暂时显示欢迎信息或重定向到 /admin/users
- **/admin/users**：用户管理列表页
- **/admin/users/:id**：用户详情页
- **/admin/roles**：角色管理列表页
- **/admin/permissions**：权限列表页

### 侧边栏导航（全部 14 个页面入口，第一批标注非活跃状态）

- 分组展示：系统管理（用户/角色/权限），资源管理（工作区/Agent/消息/文件/知识库），AI 管理（模型/供应商/API Key），运维管理（审计日志/系统配置）
- 当前页面高亮显示
- 未开发页面置灰不可点击（或显示"即将推出"标签）