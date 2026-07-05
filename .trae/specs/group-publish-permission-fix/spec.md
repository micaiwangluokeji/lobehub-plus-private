# 群组发布权限修复 Spec

## Why

群组配置页面点击"发布到发现页"按钮失败，且不显示更新和取消发布按钮。经分析，根因有两层：

1. **前端权限检查使用了错误的 action** - 调用 `usePermission('publish_agent')` 而非 `usePermission('publish_group')`，导致按钮不显示
2. **数据库权限配置可能未同步** - `group:publish:all` 权限可能未正确添加到 `rbac_permissions` 表并关联到 `super_admin` 角色

## What Changes

### 已完成修复

- ✅ 前端权限 action 修正：`usePermission('publish_agent')` → `usePermission('publish_group')`

### 待验证/修复

- 数据库权限同步：确保 `group:publish:all` 存在于 `rbac_permissions` 表
- 角色权限关联：确保 `super_admin` 角色通过 `SYSTEM_ROLE_PERMISSIONS` 包含 `group:publish:all`
- 用户角色分配：确保目标用户已分配 `super_admin` 角色（`workspace_id IS NULL`）

## Impact

- Affected specs: 群组发布到发现页功能
- Affected code:
  - `src/routes/(main)/group/profile/features/Header/index.tsx` (前端权限检查)
  - `packages/const/src/rbac.ts` (权限定义)
  - `packages/database/src/utils/seedSystemRoles.ts` (权限同步)
  - `apps/server/src/routers/lambda/agentGroup.ts` (后端路由)

## Root Cause Analysis

### 权限检查链路

```
前端                    后端                      数据库
  │                        │                          │
  │ usePermission()        │                          │
  │ ───────────────────────►                          │
  │                        │                          │
  │ canPublish 判断        │                          │
  │ (基于 action 映射)     │                          │
  │                        │                          │
  │ hasPermission()        │                          │
  │ ──────────────────────────────────────────────────►
  │                        │                          │
  │                        │ rbacService.getUserPermissions()
  │                        │ ─────────────────────────►
  │                        │                          │
  │                        │                          │ SELECT permissions.code
  │                        │                          │ FROM user_roles
  │                        │                          │ JOIN roles JOIN role_permissions JOIN permissions
  │                        │                          │ WHERE user_id = ? AND workspace_id IS NULL
  │                        │                          │
  │                        │◄─────────────────────────│
  │◄───────────────────────│                          │
  │                        │                          │
  │ 发布按钮显示            │                          │
  │ (基于 canPublish)      │                          │
  │                        │                          │
  │ 点击发布                │                          │
  │ ───────────────────────►                          │
  │                        │                          │
  │                        │ RbacModel.hasPermission('group:publish:all')
  │                        │ ─────────────────────────►
  │                        │                          │
  │                        │                          │ SELECT count(*)
  │                        │                          │ FROM user_roles JOIN ...
  │                        │                          │ WHERE permissions.code = 'group:publish:all'
  │                        │                          │
  │                        │◄─────────────────────────│
  │                        │                          │
  │                        │ 返回 true/false          │
  │◄───────────────────────│                          │
  │                        │                          │
```

### 关键代码片段

**前端权限检查 (修复前)**:
```typescript
// src/routes/(main)/group/profile/features/Header/index.tsx
const { allowed: canPublish, hasPermission } = usePermission('publish_agent');  // ❌ 错误的 action
```

**权限 action 映射**:
```typescript
// src/hooks/usePermission.ts
const ACTION_PERMISSION_MAP = {
  publish_agent: ['agent:update:all', 'agent:publish:owner'],  // Agent 权限
  publish_group: ['group:publish:all', 'group:publish:owner'], // Group 权限 ✅
};
```

**后端权限检查**:
```typescript
// apps/server/src/routers/lambda/agentGroup.ts
const canPublishAll = await rbacModel.hasPermission('group:publish:all', { workspaceId });
const canPublishOwner = await rbacModel.hasPermission('group:publish:owner', { workspaceId });
```

**权限定义**:
```typescript
// packages/const/src/rbac.ts
export const PERMISSION_ACTIONS = {
  GROUP_PUBLISH: 'group:publish',  // 基础 action
};

// 通过 getAllowedScopesForAction 生成：
// GROUP_PUBLISH_ALL = 'group:publish:all'
// GROUP_PUBLISH_OWNER = 'group:publish:owner'

export const SYSTEM_ROLE_PERMISSIONS = {
  super_admin: [...Object.values(PERMISSION_ACTIONS).map(code => `${code}:all`)],  // 包含 'group:publish:all'
  vip_user: [...`${action('GROUP_PUBLISH')}:owner`],  // 'group:publish:owner'
};
```

### 失败原因推断

1. **前端问题** (已修复):
   - `usePermission('publish_agent')` → `canPublish` 基于 `['agent:update:all', 'agent:publish:owner']`
   - 但后端检查 `group:publish:all`，前端检查的权限与后端不匹配

2. **数据库问题** (待验证):
   - `rbac_permissions` 表可能不存在 `group:publish:all` 记录
   - 需要运行 `seedSystemRoles` 同步权限定义

## ADDED Requirements

### Requirement: Group Publish Permission Check

The system SHALL use the correct permission action when checking group publish capabilities:

- Frontend MUST call `usePermission('publish_group')` for group publish button visibility
- Frontend MUST check `hasPermission('group:publish:all')` for admin capabilities
- Frontend MUST check `hasPermission('group:publish:owner')` for VIP capabilities
- Backend MUST check `group:publish:all` for admin publish operations
- Backend MUST check `group:publish:owner` for VIP submit-for-review operations

#### Scenario: Admin publishes group successfully

- **WHEN** user has `super_admin` role with `group:publish:all` permission
- **AND** frontend uses `usePermission('publish_group')`
- **THEN** publish button is visible in group profile header
- **AND** clicking publish succeeds with `visibility = 'official'`

#### Scenario: VIP submits group for review

- **WHEN** user has `vip_user` role with `group:publish:owner` permission
- **AND** frontend uses `usePermission('publish_group')`
- **THEN** submit-for-review button is visible
- **AND** clicking submit creates share with `visibility = 'pending_review'`

## MODIFIED Requirements

### Requirement: Permission Action Mapping

The `ACTION_PERMISSION_MAP` in `usePermission.ts` SHALL include both agent and group publish mappings:

```typescript
publish_agent: ['agent:update:all', 'agent:publish:owner'],
publish_group: ['group:publish:all', 'group:publish:owner'],
```

### Requirement: System Role Permissions

The `SYSTEM_ROLE_PERMISSIONS` in `@lobechat/const/rbac` SHALL include group publish permissions:

- `super_admin`: `${action('GROUP_PUBLISH')}:all` (group:publish:all)
- `vip_user`: `${action('GROUP_PUBLISH')}:owner` (group:publish:owner)

## REMOVED Requirements

None - this is a fix, not a removal.