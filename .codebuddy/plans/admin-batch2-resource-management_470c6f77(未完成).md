---
name: admin-batch2-resource-management
overview: 完成管理后台第一批遗留问题修复 + 第二批资源管理（工作区/Agent/模型/供应商）共4个模块的完整开发
todos:
  - id: first-batch-cleanup
    content: 创建 admin.ts 国际化文件、创建 admin/index.tsx 首页重定向路由、清理 RolePermissionPanel 调试日志
    status: pending
  - id: workspace-management
    content: 创建工作区管理模块：Service(tRPC) + WorkspaceList + WorkspaceDetail + 路由 + 侧边栏激活
    status: pending
    dependencies:
      - first-batch-cleanup
  - id: agent-management
    content: 创建Agent管理模块：Service(OpenAPI) + AgentList + 路由 + 侧边栏激活
    status: pending
    dependencies:
      - first-batch-cleanup
  - id: model-provider-management
    content: 创建模型+供应商管理模块：Service x2 + ModelList + ProviderList + 路由 x2 + 侧边栏激活
    status: pending
    dependencies:
      - first-batch-cleanup
---

## 完成状态评估

### 第一批（基础框架 + 核心管理）— ✅ 已完成

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 基础框架（路由、布局、守卫、通用组件、Service base层） | ✅ | 6个核心文件均存在 |
| 用户管理（列表/创建/编辑/删除/角色分配/详情） | ✅ | 完整CRUD，API齐全 |
| 角色管理（列表/创建/编辑/权限配置） | ✅ | 完整CRUD + 权限配置面板（修复了API 400问题） |
| 权限管理（只读列表/分类筛选/搜索） | ✅ | 含describePermission自动生成中文描述 |
| 国际化文件 admin.ts | ✅ | 已补充完整，含全部14个模块翻译键 |
| admin首页路由 index.tsx | ✅ | 已创建，重定向至 /admin/users |
| RolePermissionPanel 调试日志 | ✅ | 已清理所有 console.log 和 Dev 调试文本 |


### 第二批（资源管理）— ✅ 已完成

| 模块 | PRD工作量 | Service层 | UI目录 | 路由 | 侧边栏 |
| --- | --- | --- | --- | --- | --- |
| 工作区管理 | 1天 | ✅ | ✅ WorkspaceList + WorkspaceDetail | ✅ | ✅ 已激活 |
| Agent管理 | 0.5天 | ✅ | ✅ AgentList | ✅ | ✅ 已激活 |
| 模型管理 | 0.5天 | ✅ | ✅ ModelList | ✅ | ✅ 已激活 |
| 供应商管理 | 0.5天 | ✅ | ✅ ProviderList | ✅ | ✅ 已激活 |


### 第三批（数据管理）— ⏳ 当前任务

| 模块 | PRD工作量 | Service层 | UI目录 | 路由 | 侧边栏 | i18n键 |
| --- | --- | --- | --- | --- | --- | --- |
| 消息管理 | 0.5天 | ❌ | ❌ | ❌ | ❌ Coming Soon | ❌ 需补充 |
| 文件管理 | 0.5天 | ❌ | ❌ | ❌ | ❌ Coming Soon | ❌ 需补充 |
| 知识库管理 | 0.5天 | ❌ | ❌ | ❌ | ❌ Coming Soon | ❌ 需补充 |
| API Key 管理 | 0.5天 | ❌ | ❌ | ❌ | ❌ Coming Soon | ❌ 需补充 |


### 侧边栏状态

AdminSidebar 全部15个导航项已定义。当前可点击项：

- ✅ `/admin`, `/admin/users`, `/admin/roles`, `/admin/permissions`
- ✅ `/admin/workspaces`, `/admin/agents`, `/admin/models`, `/admin/providers`
- ❌ `/admin/messages`, `/admin/files`, `/admin/knowledge-bases`, `/admin/api-keys` 等标记为 Coming Soon

---

## 下一步计划：第三批数据管理（4个模块）

### 各模块技术路径

| 模块 | API协议 | 调用方式 | 关键端点 | 特性和说明 |
| --- | --- | --- | --- | --- |
| **消息管理** | OpenAPI | `AdminApiBase` | `GET /api/v1/messages?page=&pageSize=&keyword=`, `DELETE /api/v1/messages/:id` | 列表+搜索+角色筛选+详情Drawer+删除，role列Tag颜色编码 |
| **文件管理** | OpenAPI | `AdminApiBase` | `GET /api/v1/files?page=&pageSize=&keyword=`, `DELETE /api/v1/files/:id` | 列表+搜索+文件类型筛选+大小格式化(KB/MB/GB)+删除 |
| **知识库管理** | OpenAPI | `AdminApiBase` | `GET /api/v1/knowledge-bases?page=&pageSize=&keyword=`, `POST`, `PATCH /:id`, `DELETE /:id` | 完整CRUD: 列表+创建Modal+编辑Modal+删除 |
| **API Key 管理** | tRPC | `lambdaClient.apiKey.*` | `getApiKeys.query()`, `createApiKey.mutate()`, `updateApiKey.mutate()`, `deleteApiKey.mutate()` | 列表+创建Modal(一次性展示完整Key)+撤销+启用/禁用 |


> ⚠️ **实际 tRPC 方法名**：`getApiKeys`（非 `listApiKeys`）、`deleteApiKey`（非 `revokeApiKey`），无独立 `regenerateApiKey`，需通过 `updateApiKey` 实现。

### 路线图

| 顺序 | 任务 | 工作量 | 交付物 |
| --- | --- | --- | --- |
| 1 | **消息管理** | 0.5天 | Service + MessageList(含角色筛选+搜索+详情Drawer+删除) + 路由 + 侧边栏激活 + i18n键 |
| 2 | **文件管理** | 0.5天 | Service + FileList(含文件类型筛选+大小格式+删除) + 路由 + 侧边栏激活 + i18n键 |
| 3 | **知识库管理** | 0.5天 | Service + KnowledgeBaseList(含创建/编辑Modal+删除) + 路由 + 侧边栏激活 + i18n键 |
| 4 | **API Key 管理** | 0.5天 | Service + ApiKeyList(含创建Modal+一次性展示+撤销+启用/禁用) + 路由 + 侧边栏激活 + i18n键 |


### 目录结构（第三批新增文件）

```
src/
├── routes/(main)/admin/
│   ├── messages/                    ← [NEW]
│   │   └── index.tsx
│   ├── files/                       ← [NEW]
│   │   └── index.tsx
│   ├── knowledge-bases/             ← [NEW]
│   │   └── index.tsx
│   └── api-keys/                    ← [NEW]
│       └── index.tsx
├── features/Admin/
│   ├── Messages/                    ← [NEW]
│   │   ├── MessageList.tsx          # 消息列表 + 搜索 + 角色筛选 + 详情Drawer + 删除
│   │   └── index.ts
│   ├── Files/                       ← [NEW]
│   │   ├── FileList.tsx             # 文件列表 + 搜索 + 类型筛选 + 删除
│   │   └── index.ts
│   ├── KnowledgeBases/              ← [NEW]
│   │   ├── KnowledgeBaseList.tsx    # 知识库列表 + CRUD Modal + 删除
│   │   └── index.ts
│   └── ApiKeys/                     ← [NEW]
│       ├── ApiKeyList.tsx           # API Key列表 + 创建Modal(一次性展示) + 撤销
│       └── index.ts
├── services/admin/
│   ├── messages.ts                  ← [NEW] 消息 OpenAPI调用
│   ├── files.ts                     ← [NEW] 文件 OpenAPI调用
│   ├── knowledge-bases.ts           ← [NEW] 知识库 OpenAPI调用
│   └── api-keys.ts                  ← [NEW] API Key tRPC调用
├── locales/default/
│   └── admin.ts                     ← [MODIFY] 补充4个模块的页面级i18n键
├── spa/router/
│   ├── desktopRouter.config.tsx     ← [MODIFY] 添加4个路由
│   └── desktopRouter.config.desktop.tsx ← [MODIFY] 同步添加
└── features/Admin/Layout/
    └── AdminSidebar.tsx             ← [MODIFY] 移除4个模块的Coming Soon
```

### 实施注意事项

- **路由同步**: 两个 config 文件必须同步修改相同的路径结构，否则 `desktopRouter.sync.test.tsx` 会失败
- **API Key 方法名确认**: `lambdaClient.apiKey.getApiKeys.query()` / `deleteApiKey.mutate()`，不是 `listApiKeys`/`revokeApiKey`
- **消息角色筛选**: 后端支持按 role 过滤（user/assistant/system），前端用 Select 组件
- **文件大小格式化**: 自动将 bytes 转为 KB/MB/GB 展示
- **知识库 CRUD**: 创建用 POST，编辑用 PATCH，删除用 DELETE，均通过 AdminApiBase
- **API Key 创建**: 创建成功后一次性展示完整 Key，提示用户复制保存（不可再次获取）
- **原有模式复用**: 所有列表页复用 AdminSearch + AdminTable + PageHeader + StatusTag 等通用组件
- **Popconfirm 删除**: 所有删除操作使用 Popconfirm 二次确认，危险操作用红色按钮