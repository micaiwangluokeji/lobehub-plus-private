# LobeHub RBAC 权限系统

## 系统概述

LobeHub 采用基于角色的访问控制（RBAC）系统，支持两级权限模型：

1. **系统级角色**：`super_admin`（超级管理员）- 全局权限
2. **工作区级角色**：`workspace_owner`、`workspace_member`、`workspace_viewer` - 工作区内权限

权限格式：`resource:action:scope`

- `resource`：资源类型（agent、session、user 等）
- `action`：操作（create、read、update、delete 等）
- `scope`：作用范围（all、owner）

---

## 一、系统级角色

### super_admin（超级管理员）

| 属性 | 值 |
|--------|-----|
| 角色标识 | `super_admin` |
| 作用范围 | 全局（所有工作区 |
| 权限 | 拥有系统所有权限 |
| 描述 | Administrator with all system permissions |

**特点：
- 不绑定任何工作区
- 可管理所有用户、角色、权限
- 可管理所有工作区
- 系统级资源（RBAC 管理）只有 super_admin 才能操作

---

## 二、工作区级角色

每个工作区创建时自动初始化三个系统角色：

### 1. workspace_owner（工作区所有者）

| 属性 | 值 |
|--------|-----|
| 角色标识 | `workspace_owner` |
| 显示名称 | Owner |
| 描述 | Full access including billing, members, and all content. |

**权限范围**：
- 工作区管理：读、更新、删除、设置更新
- 计费管理：读、管理
- 成员管理：读、邀请、移除、更新角色
- 审计日志：读
- 自定义角色：CRUD
- 所有内容资源：全部权限（可管理其他成员的资源）

### 2. workspace_member（工作区成员）

| 属性 | 值 |
|--------|-----|
| 角色标识 | `workspace_member` |
| 显示名称 | Member |
| 描述 | Can create and edit own content, read shared content. |

**权限范围**：
- 工作区：只读
- 成员：只读
- 内容资源：可创建/编辑/删除自己的资源，读取所有共享资源
- AI 模型：可调用
- API Key：只能管理自己的

### 3. workspace_viewer（工作区查看者）

| 属性 | 值 |
|--------|-----|
| 角色标识 | `workspace_viewer` |
| 显示名称 | Viewer |
| 描述 | Read-only access to workspace content. |

**权限范围**：
- 工作区：只读
- 成员：只读
- 所有内容：只读
- **注意**：不能调用模型（无 message:create 权限）

---

## 三、权限资源分类

### Agent 管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `agent:read` | 读取 Agent | all, owner |
| `agent:create` | 创建 Agent | all, owner |
| `agent:update` | 更新 Agent | all, owner |
| `agent:delete` | 删除 Agent | all, owner |
| `agent:fork` | 复制 Agent | all, owner |

### AI 基础设施管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `ai_model:read` | 读取 AI 模型 | all, owner |
| `ai_model:create` | 创建 AI 模型 | all, owner |
| `ai_model:update` | 更新 AI 模型 | all, owner |
| `ai_model:delete` | 删除 AI 模型 | all, owner |
| `ai_model:invoke` | 调用 AI 模型 | all, owner |
| `ai_provider:read` | 读取 AI 提供商 | all, owner |
| `ai_provider:create` | 创建 AI 提供商 | all, owner |
| `ai_provider:update` | 更新 AI 提供商 | all, owner |
| `ai_provider:delete` | 删除 AI 提供商 | all, owner |

### API Key 管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `api_key:read` | 读取 API Key | all, owner |
| `api_key:create` | 创建 API Key | all, owner |
| `api_key:update` | 更新 API Key | all, owner |
| `api_key:delete` | 删除 API Key | all, owner |

### 文档管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `document:read` | 读取文档 | all, owner |
| `document:create` | 创建文档 | all, owner |
| `document:update` | 更新文档 | all, owner |
| `document:delete` | 删除文档 | all, owner |

### 文件管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `file:read` | 读取文件 | all, owner |
| `file:upload` | 上传文件 | all, owner |
| `file:update` | 更新文件 | all, owner |
| `file:delete` | 删除文件 | all, owner |

### 知识库管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `knowledge_base:read` | 读取知识库 | all, owner |
| `knowledge_base:create` | 创建知识库 | all, owner |
| `knowledge_base:update` | 更新知识库 | all, owner |
| `knowledge_base:delete` | 删除知识库 | all, owner |

### 消息管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `message:read` | 读取消息 | all, owner |
| `message:create` | 创建消息 | all, owner |
| `message:update` | 更新消息 | all, owner |
| `message:delete` | 删除消息 | all, owner |

### 翻译管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `translation:read` | 读取翻译 | all, owner |
| `translation:create` | 创建翻译 | all, owner |
| `translation:update` | 更新翻译 | all, owner |
| `translation:delete` | 删除翻译 | all, owner |

### RBAC 管理（系统级）

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `rbac:role_read` | 读取角色 | all |
| `rbac:role_create` | 创建角色 | all |
| `rbac:role_update` | 更新角色 | all |
| `rbac:role_delete` | 删除角色 | all |
| `rbac:permission_read` | 读取权限 | all |
| `rbac:permission_create` | 创建权限 | all |
| `rbac:permission_update` | 更新权限 | all |
| `rbac:permission_delete` | 删除权限 | all |
| `rbac:user_role_read` | 读取用户角色 | all |
| `rbac:user_role_update` | 更新用户角色 | all |
| `rbac:user_role_delete` | 删除用户角色 | all |
| `rbac:user_permission_read` | 读取用户权限 | all |
| `rbac:user_permission_update` | 更新用户权限 | all |

**注意**：RBAC 资源只有 `all` 范围，属于系统级资源。

### 会话管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `session:read` | 读取会话 | all, owner |
| `session:create` | 创建会话 | all, owner |
| `session:update` | 更新会话 | all, owner |
| `session:delete` | 删除会话 | all, owner |

### 会话分组管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `session_group:read` | 读取会话分组 | all, owner |
| `session_group:create` | 创建会话分组 | all, owner |
| `session_group:update` | 更新会话分组 | all, owner |
| `session_group:delete` | 删除会话分组 | all, owner |

### 主题管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `topic:read` | 读取主题 | all, owner |
| `topic:create` | 创建主题 | all, owner |
| `topic:update` | 更新主题 | all, owner |
| `topic:delete` | 删除主题 | all, owner |

### 用户管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `user:read` | 读取用户 | all, owner |
| `user:create` | 创建用户 | all |
| `user:update` | 更新用户 | all, owner |
| `user:delete` | 删除用户 | all |

**注意**：
- `user:create` 和 `user:delete` 只有 `all` 范围
- `user:read` 和 `user:update` 支持 `all` 和 `owner` 范围

### 工作区管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `workspace:read` | 读取工作区 | all |
| `workspace:update` | 更新工作区 | all |
| `workspace:delete` | 删除工作区 | all |
| `workspace:settings_update` | 更新工作区设置 | all |
| `workspace:billing_read` | 读取计费信息 | all |
| `workspace:billing_manage` | 管理计费 | all |

**注意**：工作区资源只有 `all` 范围。

### 工作区成员管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `workspace_member:read` | 读取成员 | all |
| `workspace_member:invite` | 邀请成员 | all |
| `workspace_member:remove` | 移除成员 | all |
| `workspace_member:update_role` | 更新成员角色 | all |

### 工作区审计

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `workspace_audit:read` | 读取审计日志 | all |

### 工作区角色管理

| 权限代码 | 说明 | 支持 scope |
|----------|------|-----------|
| `workspace_role:read` | 读取角色 | all |
| `workspace_role:create` | 创建角色 | all |
| `workspace_role:update` | 更新角色 | all |
| `workspace_role:delete` | 删除角色 | all |

---

## 四、数据库表结构

### rbac_roles（角色表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | text (nanoId) | 主键 |
| `name` | text | 角色名称（如 super_admin、workspace_owner） |
| `display_name` | text | 显示名称 |
| `description` | text | 角色描述 |
| `is_system` | boolean | 是否系统角色 |
| `is_active` | boolean | 是否启用 |
| `metadata` | jsonb | 元数据 |
| `workspace_id` | text | 工作区 ID（全局角色为 null） |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

索引：
- `rbac_roles_workspace_id_idx` - 工作区索引
- `rbac_roles_name_workspace_unique` - 名称+工作区唯一索引

### rbac_permissions（权限表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | text (nanoId) | 主键 |
| `code` | text | 权限代码（唯一） |
| `name` | text | 权限名称 |
| `description` | text | 权限描述 |
| `category` | text | 权限分类 |
| `is_active` | boolean | 是否启用 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### rbac_role_permissions（角色-权限关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `role_id` | text | 角色 ID（外键） |
| `permission_id` | text | 权限 ID（外键） |
| `created_at` | timestamp | 创建时间 |

主键：`(role_id, permission_id)`

### rbac_user_roles（用户-角色关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid | 主键 |
| `user_id` | text | 用户 ID（外键） |
| `role_id` | text | 角色 ID（外键） |
| `workspace_id` | text | 工作区 ID（全局角色为 null） |
| `created_at` | timestamp | 创建时间 |
| `expires_at` | timestamp | 过期时间（支持临时角色） |

索引：
- `rbac_user_roles_user_role_scope_unique` - 用户+角色+工作区唯一
- `rbac_user_roles_user_id_idx` - 用户索引
- `rbac_user_roles_role_id_idx` - 角色索引
- `rbac_user_roles_workspace_id_idx` - 工作区索引

---

## 五、权限作用域规则

### Scope 计算规则

```typescript
// 默认规则
// RBAC 资源：只有 all（系统级资源）
if (resource === 'rbac') return ['ALL'];

// 工作区资源：只有 all（工作区本身就是隔离边界）
if (resource.startsWith('workspace')) return ['ALL'];

// 用户资源的特殊处理
if (resource === 'user') {
  if (action === 'create' || action === 'delete') return ['ALL'];
  return ['ALL', 'OWNER'];
}

// 默认：ALL + OWNER
return ['ALL', 'OWNER'];
```

### Scope 含义

- **`all`**：可操作所有该资源的所有实例
- **`owner`**：只能操作自己创建/拥有的资源

---

## 六、关键代码位置

| 功能 | 文件路径 |
|------|---------|
| 权限常量定义 | `packages/const/src/rbac.ts` |
| 数据库 Schema | `packages/database/src/schemas/rbac.ts` |
| 权限检查工具 | `src/utils/rbac.ts` |
| 前端权限 Hook | `src/hooks/usePermission.ts` |
| 服务端 RBAC 中间件 | `packages/business-server/src/trpc-middlewares/rbacPermission.ts |
| 工作区认证中间件 | `packages/business-server/src/trpc-middlewares/workspaceAuth.ts |

---

## 七、创建超级管理员

目前超级管理员只能通过数据库操作创建：

```sql
-- 1. 创建 super_admin 角色（如果不存在）
INSERT INTO rbac_roles (id, name, display_name, description, is_system, is_active)
VALUES ('super_admin_role', 'super_admin', 'Super Admin', 'Administrator with all system permissions', true, true)
ON CONFLICT DO NOTHING;

-- 2. 将所有权限分配给 super_admin
-- （需要先确保所有权限都在 rbac_permissions 表中）

-- 3. 给用户分配 super_admin 角色
INSERT INTO rbac_user_roles (user_id, role_id)
VALUES ('user_id_here', 'super_admin_role')
ON CONFLICT DO NOTHING;
```

---

## 八、自定义角色开发建议

### 后端权限校验

```typescript
// 示例：在 tRPC 路由中使用权限中间件
import { rbacPermissionMiddleware } from '@lobechat/business-server/trpc-middlewares/rbacPermission';

const protectedProcedure = t.procedure
  .use(rbacPermissionMiddleware(['agent:create:all'))

// 检查权限
```

### 前端权限判断

```typescript
// 使用 usePermission hook
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const canCreateAgent = usePermission('agent:create');
  
  if (!canCreateAgent) return null;
  return <button>Create Agent</button>;
}
```

### 新增权限开发难度评估

1. **后端 API 层已有完整的 RBAC 系统已实现** ✅ 已实现
- 角色管理已有完整的 RBAC 后端 API 接口
- 角色表结构完整

2. **前端管理界面** ❌ 未实现
- 目前没有可视化的角色管理界面
- 没有用户角色分配界面
- 没有权限配置界面

3. **开发工作量**
- 后端：基础已完成，可直接使用
- 前端：需要从零开发管理界面
- 预计开发周期：约 2-3 周（中等复杂度）
