# 发现页与发布功能修复 - 产品需求文档

## Overview

- **Summary**: 修复 canary 合并到 main 后丢失的功能：发现页（discover/agent）导航入口不可见，Agent Profile 页面和 Group Profile 页面缺少"发布到发现页"按钮。
- **Purpose**: 恢复用户（尤其是 super_admin/root 用户）将 Agent 和 Group 发布到发现页的能力，确保发现页导航在侧边栏正常显示。
- **Target Users**: 所有用户，特别是 super_admin 和 pro_user

## Goals

- 恢复侧边栏发现页导航入口的正常显示
- 在 Agent Profile 页面添加"发布到发现页"按钮
- 在 Group Profile 页面添加"发布到发现页"按钮
- 确保 RBAC 权限正确控制发布功能的可见性

## Non-Goals (Out of Scope)

- 修改发现页本身的布局和内容
- 修改社区页面（/community）的发布功能
- 修改外部市场（marketApi）相关的发布功能
- 修改 RBAC 权限模型本身

## Background & Context

### 调查发现

#### 1. 发现页导航

- **路由存在**: `/discover/agent` 在 `desktopRouter.config.tsx` 和 `desktopRouter.config.desktop.tsx` 中已定义
- **页面组件存在**: `src/routes/(main)/discover/agent/index.tsx`
- **导航项存在**: `useNavLayout.ts` 第 80-86 行定义了 Discover 导航
- **Feature Flag 默认开启**: `nav_discover_for_*_user` 默认都是 `true`
- **问题**: `NAVIGATION_ROUTES`（在 `packages/app-config/src/routes/index.ts`）中没有 `discover` 路由 ID，只有 `community`。`getRouteById('discover')` 返回 `undefined`，虽然 icon 会 fallback 到 `community` 的 icon，但需要确认导航是否实际可见。

#### 2. 发布到发现页按钮

- **Agent Profile 页面**: `src/routes/(main)/agent/profile/features/Header/index.tsx` 中没有"发布到发现页"按钮
- **Group Profile 页面**: `src/routes/(main)/group/profile/features/GroupProfile/index.tsx` 中没有"发布到发现页"按钮
- **服务层存在**: `officialAgentService.publishAsOfficialAgent` 和 `officialGroupService.publishAsOfficialGroup` 存在
- **权限定义存在**: `AGENT_PUBLISH` 和 `GROUP_PUBLISH` 在 `packages/const/src/rbac.ts` 中定义
- **权限检查存在**: `publish_agent` 和 `publish_group` 在 `src/hooks/usePermission.ts` 中定义
- **ProGate 存在**: `src/features/ProGate/index.tsx` 中有 `publish_agent` 场景，用于免费用户升级提示

#### 3. 用户角色

- **903164524@qq.com**: `is_root = true`，拥有 `super_admin` 全局角色和 `workspace_owner` 工作区角色
- super_admin 拥有所有权限（`PERMISSION_ACTIONS` 中的所有 `:all` 权限）

### 根本原因分析

发布按钮在之前的开发中可能存在，但在 canary 合并到 main 的过程中丢失了。当前 Agent Profile 和 Group Profile 页面的 Header 组件中没有包含发布功能的按钮。

## Functional Requirements

- **FR-1**: 侧边栏发现页导航入口对所有角色正常显示（受 feature flag 控制）
- **FR-2**: Agent Profile 页面 Header 中添加"发布到发现页"按钮，仅对有 `publish_agent` 权限的用户显示
- **FR-3**: Group Profile 页面 Header 中添加"发布到发现页"按钮，仅对有 `publish_group` 权限的用户显示
- **FR-4**: 发布按钮点击后调用 `officialAgentService.publishAsOfficialAgent` 或 `officialGroupService.publishAsOfficialGroup`
- **FR-5**: 已发布的 Agent/Group 应显示"取消发布"按钮
- **FR-6**: 免费用户点击发布按钮时显示升级提示（ProGate）

## Non-Functional Requirements

- **NFR-1**: 发布操作需要有确认弹窗，防止误操作
- **NFR-2**: 权限检查使用现有的 `usePermission` hook，保持一致性
- **NFR-3**: 组件使用 `@lobehub/ui/base-ui` 的 `confirmModal`，保持 UI 一致性

## Constraints

- **Technical**: React 19 + antd + @lobehub/ui 组件库
- **Dependencies**: 依赖 `officialAgentService` 和 `officialGroupService` 的 TRPC 接口正常工作

## Assumptions

- 后端 `publishAsOfficialAgent` 和 `publishAsOfficialGroup` 接口正常工作
- `usePermission('publish_agent')` 和 `usePermission('publish_group')` 正确返回权限状态
- super_admin 用户的 `agent:publish:all` 和 `group:publish:all` 权限已正确种子到数据库

## Acceptance Criteria

### AC-1: 发现页导航可见

- **Given**: 用户已登录，feature flag `nav_discover_for_*_user` 为 true
- **When**: 用户查看侧边栏
- **Then**: 发现页导航入口（带 icon 和标题）正常显示
- **Verification**: `human-judgment`

### AC-2: Agent Profile 页面发布按钮可见（有权限）

- **Given**: 用户已登录且有 `publish_agent` 权限（如 super_admin 或 pro_user）
- **When**: 用户访问 Agent Profile 页面（如 `/agent/agt_xxx/profile`）
- **Then**: 在 Header 区域显示"发布到发现页"按钮
- **Verification**: `human-judgment`

### AC-3: Agent Profile 页面发布按钮不可见（无权限）

- **Given**: 用户已登录但无 `publish_agent` 权限（如 free_user）
- **When**: 用户访问 Agent Profile 页面
- **Then**: 不显示"发布到发现页"按钮（或显示带 ProGate 升级提示的按钮）
- **Verification**: `human-judgment`

### AC-4: 发布操作成功

- **Given**: 用户有发布权限且 Agent/Group 未发布
- **When**: 用户点击"发布到发现页"按钮并确认
- **Then**: 调用发布接口成功，状态更新为已发布
- **Verification**: `programmatic`

### AC-5: Group Profile 页面发布按钮可见（有权限）

- **Given**: 用户已登录且有 `publish_group` 权限
- **When**: 用户访问 Group Profile 页面（如 `/group/cg_xxx/profile`）
- **Then**: 在 Header 区域显示"发布到发现页"按钮
- **Verification**: `human-judgment`

### AC-6: 取消发布操作

- **Given**: Agent/Group 已发布到发现页，用户有发布权限
- **When**: 用户点击"取消发布"按钮并确认
- **Then**: 调用取消发布接口成功，状态更新为未发布
- **Verification**: `programmatic`

## Open Questions

- [ ] 发现页导航之前是否显示过？用户提到的"不在了"是指合并后丢失还是从未显示？
- [ ] 发布按钮之前的具体位置和样式是什么样的？是在 Header 的下拉菜单中还是直接作为按钮显示？
