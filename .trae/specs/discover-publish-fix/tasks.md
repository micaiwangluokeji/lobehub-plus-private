# 发现页与发布功能修复 - 实施计划

## [x] Task 1: 检查并修复发现页导航显示问题

- **Priority**: high
- **Depends On**: None
- **Description**:
  - 检查 `useNavLayout.ts` 中发现页导航项是否实际可见
  - 检查 `NAVIGATION_ROUTES` 是否缺少 `discover` 路由 ID（当前只有 `community`）
  - 检查 `useUserRoles` hook 是否正确返回用户角色
  - 验证 `isNavVisibleForRole('discover')` 逻辑是否正确工作
  - 如果导航不可见，定位并修复问题
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: `getRouteById('discover')` 不再返回 `undefined`，或在 `useNavLayout` 中有正确 fallback
  - `human-judgement` TR-1.2: 在浏览器中侧边栏可以看到发现页导航入口
- **Notes**: `NAVIGATION_ROUTES` 缺少 `discover` ID，需要添加。当前 `getRouteById('discover')` 返回 `undefined`，icon fallback 到 community icon 可工作，但 CMDK 搜索等功能可能受影响。

## [x] Task 2: 在 Agent Profile 页面 Header 添加发布到发现页按钮

- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 在 `src/routes/(main)/agent/profile/features/Header/index.tsx` 中添加"发布到发现页"按钮
  - 使用 `usePermission('publish_agent')` 检查权限
  - 使用 `officialAgentService.publishAsOfficialAgent` 执行发布
  - 使用 `officialAgentService.unpublishOfficialAgent` 执行取消发布
  - 使用 `officialAgentKeys.isOfficial` 检查当前 Agent 是否已发布
  - 对免费用户使用 `ProGate` 组件包裹按钮
  - 按钮放在 Header 的下拉菜单（DropdownMenu）中
  - 添加确认弹窗（confirmModal）
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-4, AC-6
- **Test Requirements**:
  - `programmatic` TR-2.1: Agent Profile Header 组件中包含发布按钮的菜单项
  - `programmatic` TR-2.2: 发布按钮受 `usePermission('publish_agent')` 控制
  - `human-judgement` TR-2.3: super_admin 用户在 Agent Profile 页面能看到"发布到发现页"按钮
  - `human-judgement` TR-2.4: 点击发布按钮后弹出确认框，确认后调用发布接口
- **Notes**: 参考社区页面中的发布功能实现（`community/(detail)/agent`）。AgentStatusTag 已经在使用 `marketApiService` 检查状态，但发布功能应使用 `officialAgentService`。

## [x] Task 3: 在 Group Profile 页面添加发布到发现页按钮

- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 在 `src/routes/(main)/group/profile/features/GroupProfile/index.tsx` 或其 Header 区域添加"发布到发现页"按钮
  - 使用 `usePermission('publish_group')` 检查权限
  - 使用 `officialGroupService.publishAsOfficialGroup` 执行发布
  - 使用 `officialGroupService.unpublishOfficialGroup` 执行取消发布
  - 对免费用户使用 `ProGate` 组件包裹按钮
  - 添加确认弹窗（confirmModal）
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-3.1: Group Profile 页面中包含发布按钮
  - `programmatic` TR-3.2: 发布按钮受 `usePermission('publish_group')` 控制
  - `human-judgement` TR-3.3: super_admin 用户在 Group Profile 页面能看到"发布到发现页"按钮
  - `human-judgement` TR-3.4: 点击发布按钮后弹出确认框，确认后调用发布接口
- **Notes**: 参考 Task 2 的 Agent 发布按钮实现，保持一致性。

## [x] Task 4: 验证 super_admin 权限种子数据完整性

- **Priority**: medium
- **Depends On**: None
- **Description**:
  - 检查数据库中 `rbac_roles` 表是否有 `super_admin` 角色
  - 检查 `rbac_role_permissions` 表中 `super_admin` 角色是否包含 `agent:publish:all` 和 `group:publish:all` 权限
  - 检查 `rbac_permissions` 表中是否有对应的权限记录
  - 如果缺少，运行种子脚本补充
- **Acceptance Criteria Addressed**: AC-2, AC-4, AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: `rbac_permissions` 表中存在 `agent:publish:all` 和 `group:publish:all` 权限
  - `programmatic` TR-4.2: `super_admin` 角色在 `rbac_role_permissions` 中包含上述权限
  - `programmatic` TR-4.3: `903164524@qq.com` 用户通过 TRPC `user.getUserPermissions` 接口返回的权限列表包含 `agent:publish:all` 和 `group:publish:all`
- **Notes**: 这是确保权限系统正常工作的前提条件。
