# 发现页增强与导航可见性控制 Spec

## Why
发现页已上线但导航中缺少入口按钮（`DEFAULT_SIDEBAR_ITEMS` 未包含 `discover`），且发现页目前仅支持单一智能体，需要扩展支持智能体群组（专家团）发布和展示。此外管理员需要能在设置页面控制各导航按钮对不同角色的可见性。

## What Changes
- 修复发现按钮不可见的问题：在 `DEFAULT_SIDEBAR_ITEMS` 中添加 `discover`，位于 `pages` 之后、`recents` 之前
- 发现页增加分类 Tab：「专家」（单一智能体）和「专家团」（智能体群组）
- 后端新增智能体群组发布/取消发布接口（复用 `agent_shares` 的 `visibility='official'` 机制）
- 前端智能体群组编辑页增加"发布到发现页"按钮
- 管理员设置页（外观 → 通用设置）增加导航可见性配置：可按角色控制各导航按钮的显隐

## Impact
- Affected specs: saas-discover-vs-community
- Affected code:
  - `src/store/global/selectors/systemStatus.ts` — `DEFAULT_SIDEBAR_ITEMS`
  - `src/routes/(main)/discover/agent/index.tsx` — 发现页增加分类 Tab
  - `src/features/Discover/` — 新增 AgentGroupList 组件
  - `apps/server/src/routers/lambda/agentGroup.ts` — 新增发布/取消发布接口
  - `packages/database/src/` — agentGroup 共享表或 visibility 字段扩展
  - `src/routes/(main)/group/profile/features/Header/index.tsx` — 增加发布按钮
  - `src/routes/(main)/settings/common/features/Common/Common.tsx` — 增加导航可见性配置
  - `packages/app-config/src/featureFlags/schema.ts` — 新增导航可见性 feature flags

## ADDED Requirements

### Requirement: 发现按钮导航可见
系统应当在左侧导航栏中显示「发现」按钮，位于首页和任务按钮之间。

#### Scenario: 用户查看导航栏
- **WHEN** 任意已登录用户打开应用
- **THEN** 左侧导航栏在首页和任务之间显示「发现」按钮
- **AND** 点击后跳转到 `/discover/agent`

### Requirement: 发现页分类展示
系统应当在发现页提供两个分类 Tab：「专家」和「专家团」。

#### Scenario: 用户浏览发现页
- **WHEN** 用户访问 `/discover/agent`
- **THEN** 页面顶部显示两个 Tab：「专家」和「专家团」
- **AND** 默认选中「专家」Tab，展示已发布的单一智能体列表
- **WHEN** 用户点击「专家团」Tab
- **THEN** 展示已发布的智能体群组列表

#### Scenario: 智能体群组卡片展示
- **WHEN** 用户在「专家团」Tab 下浏览
- **THEN** 每个群组卡片显示群组名称、描述、成员数量、发布时间
- **AND** 点击卡片可查看群组详情
- **AND** 详情页提供「使用」按钮，点击后安装群组到用户自己的列表

### Requirement: 管理员发布智能体群组到发现页
系统应当允许管理员将其创建的智能体群组发布到发现页。

#### Scenario: 管理员发布智能体群组
- **WHEN** 管理员在智能体群组编辑页点击发布按钮
- **THEN** 该群组出现在发现页的「专家团」分类中
- **AND** 所有用户可以看到并安装该群组

#### Scenario: 管理员取消发布智能体群组
- **WHEN** 管理员在智能体群组编辑页点击取消发布按钮
- **THEN** 该群组从发现页移除
- **AND** 已安装的用户不受影响，仍可继续使用

#### Scenario: VIP 用户发布智能体群组
- **WHEN** VIP 用户在智能体群组编辑页点击发布按钮
- **THEN** 仅当该用户是群组创建者时才允许发布
- **AND** 该群组出现在发现页的「专家团」分类中

### Requirement: 导航可见性配置
系统应当允许管理员在设置页（外观 → 通用设置）中配置各导航按钮对不同角色的可见性。

#### Scenario: 管理员配置导航可见性
- **WHEN** 管理员访问 `/settings/appearance` 页面
- **THEN** 通用设置区块中显示「导航可见性」配置项
- **AND** 可分别配置「普通用户」和「VIP 用户」的导航按钮可见性
- **AND** 可控制的导航项包括：首页、发现、任务、文稿、生成、资源、记忆
- **AND** 社区按钮始终仅管理员可见，不在配置项中

#### Scenario: 普通用户或 VIP 用户查看导航
- **WHEN** 普通用户或 VIP 用户打开应用
- **THEN** 导航栏仅显示管理员配置为可见的导航按钮
- **AND** 被隐藏的导航按钮不显示，但用户仍可通过直接输入 URL 访问对应页面

## MODIFIED Requirements

### Requirement: 发现页扩展支持智能体群组
原有发现页仅支持单一智能体展示，现扩展为同时支持单一智能体（专家）和智能体群组（专家团）的展示和安装。

### Requirement: RBAC 权限扩展
在已有 `agent:publish:owner` 权限的基础上，新增 `group:publish:all`（管理员）和 `group:publish:owner`（VIP 用户）权限，用于控制智能体群组的发布。
