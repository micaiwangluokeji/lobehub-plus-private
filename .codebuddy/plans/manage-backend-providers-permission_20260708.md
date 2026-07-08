# 计划：管理后台第六批——权限控制+供应商管理增强

## 背景

1. **权限控制**：pro_user/vip_user 不应能创建/编辑模型供应商和模型，只能使用 super_admin 设置好的默认供应商。
2. **供应商管理增强**：管理后台 `/admin/providers` 缺少"创建供应商"和"模型管理"功能，需要复用用户端 `/settings/provider` 的现有组件。

---

## 模块 A：权限控制

### A1. 给 RolePermissionPanel 添加搜索框

**文件**：`src/features/Admin/Roles/RolePermissionPanel.tsx`

- 在权限列表上方添加一个 `Input.Search` 搜索框
- 按 `perm.code` 和 `perm.name` 过滤权限列表（前端过滤，不涉及后端 API 改动）
- 搜索时不影响已勾选的权限状态
- 自动清空搜索框时恢复全量列表

### A2. 修改 SYSTEM_ROLE_PERMISSIONS 移除 pro_user 的供应商/模型创建权限

**文件**：`packages/const/src/rbac.ts`

从 `PRO_USER` 的权限列表中移除：

```
${action('AI_MODEL_CREATE')}:owner
${action('AI_MODEL_UPDATE')}:owner
${action('AI_MODEL_DELETE')}:owner
${action('AI_PROVIDER_CREATE')}:owner
${action('AI_PROVIDER_UPDATE')}:owner
${action('AI_PROVIDER_DELETE')}:owner
```

保留：

```
AI_MODEL_READ:all
AI_MODEL_INVOKE:all
AI_PROVIDER_READ:all
```

> 注意：此修改只影响**新注册用户**。已有用户通过 `user_roles` 表的 `permissions` 字段存储了权限，需要数据库迁移（`UPDATE user_roles SET permissions = ...`）。如果只是开发环境，可以手动删除已有用户数据后重新注册。

### A3. 前端权限隐藏（settings/provider 页面）

**文件 1**：`src/routes/(main)/settings/provider/features/CreateNewProvider/AddNew.tsx`（或其他触发入口）

- 添加 `usePermission('ai_provider:update')` 或者 `usePermission().hasPermission('ai_provider:create:owner')`
- 无权限时隐藏"+添加供应商"按钮

**文件 2**：`src/routes/(main)/settings/provider/features/ProviderConfig/index.tsx`

- 无权限时禁用编辑表单（所有输入框 `disabled`）

**文件 3**：`src/routes/(main)/settings/provider/detail/default/CustomProviderDetail.tsx`

- 无权限时禁用 `ModelList` 中的添加模型操作
- 无权限时禁用 `ProviderConfig` 中的编辑

### A4. 角色管理页面权限分类展示优化（可选）

如果权限分类不够清晰，可以调整 `category` 的分组方式，确保 `ai_provider` 和 `ai_model` 相关的权限归入"AI 基础设施"分类。

---

## 模块 B：管理后台 Providers 增强

### B1. 添加"创建供应商"按钮

**文件**：`src/features/Admin/Providers/ProviderList.tsx`

- 在列表上方（搜索框旁边或工具栏区域）添加"创建供应商"按钮
- 点击后复用 `/settings/provider/features/CreateNewProvider` 的弹窗组件
- 创建成功后刷新列表定位到新供应商

注意：需要确认 `CreateNewProvider` 使用的 store（`useAiInfraStore`）在管理后台上下文中是否正常工作。如果 store 不兼容，则需要：

- 方案A：直接调用 `adminProviderService.create()` 创建，跳转到编辑页面
- 方案B：导入 `CreateNewProvider` 弹窗组件

### B2. 添加模型管理

**文件**：`src/features/Admin/Providers/ProviderDetail.tsx`

- 在现有编辑表单下方添加 `<ModelList id={id} />` 组件
- 参考 `CustomProviderDetail.tsx` 的结构

### B3. 修复数据展示

**文件**：`src/features/Admin/Providers/ProviderList.tsx` 的表格列配置

- 检查 `name` 和 `description` 等字段显示为 `-` 的原因
- 可能是后端 `list` API 返回的数据格式与前端 `AdminProvider` 接口字段不匹配
- 需要确认 `AdminProvider` 接口中的字段（name、label、description）和后端 API 返回的字段是否一致

---

## 技术路径

### 文件变更清单

| 文件                                                                        | 操作 | 归属模块 |
| --------------------------------------------------------------------------- | ---- | -------- |
| `src/features/Admin/Roles/RolePermissionPanel.tsx`                          | 修改 | A1       |
| `packages/const/src/rbac.ts`                                                | 修改 | A2       |
| `src/routes/(main)/settings/provider/features/CreateNewProvider/AddNew.tsx` | 修改 | A3       |
| `src/routes/(main)/settings/provider/features/ProviderConfig/index.tsx`     | 修改 | A3       |
| `src/features/Admin/Providers/ProviderList.tsx`                             | 修改 | B1, B3   |
| `src/features/Admin/Providers/ProviderDetail.tsx`                           | 修改 | B2       |

### 注意事项

1. **权限修改只影响新用户**：`SYSTEM_ROLE_PERMISSIONS` 在数据库初始化时（`seedSystemRoles`）写入 `system_roles` 表。已有用户则通过 `user_roles` 表直接绑定了 permission ID。修改后新用户会自动获取新权限，老用户需要 DB 迁移。
2. **CreateNewProvider 的依赖**：它依赖 `useAiInfraStore`，需要确认这个 store 是否可以在管理后台使用（通常 store 是全局的，应该可以）。
3. **后端 API**：`adminProviderService.create()` 已实现，不需要改动后端。
4. **ModelList 的依赖**：依赖 `aiProviderKeys` SWR key，需要确认管理后台上下文可以正常获取数据。
