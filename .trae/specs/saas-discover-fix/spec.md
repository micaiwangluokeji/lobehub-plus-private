# 发现页增强与按钮修复 Spec

## Why
上一轮 `saas-discover-enhance` 规划中的代码已全部编写完成，但用户反馈发现按钮仍然不可见。需要排查按钮不可见的根因并修复，同时验证所有已实现功能能正常工作。

## 现状分析

### 已实现（代码已存在）
- `DEFAULT_SIDEBAR_ITEMS` 已包含 `discover`
- `useNavLayout.ts` 已将发现按钮放在 topNavItems 中（首页和任务之间）
- 发现页已有「专家」和「专家团」两个分类 Tab
- `AgentGroupList` 组件已实现群组列表展示
- `officialGroupService` 已实现群组发布/查询/安装
- `ChatGroupShareModel` 后端模型和 `chatGroupShares` 数据库表已创建
- `agentGroup` 路由已有 `publishAsOfficialGroup`、`getOfficialGroups` 等接口
- 群组编辑页 Header 已有发布/取消发布按钮
- `NavVisibility` 组件已集成到 `/settings/appearance` 页面
- Feature flags 已有 14 个导航可见性标志
- `updateNavVisibility` 后端 mutation 已实现
- 群组详情页路由 `/discover/group/:groupId` 已注册

### 待排查/修复
- 发现按钮在浏览器中不可见：可能原因包括 `showMarket` feature flag 为 false、开发服务器未重启、浏览器缓存 301 重定向
- 所有功能需要端到端验证

## What Changes
- 排查并修复发现按钮不可见的根因
- 确保开发服务器重启后配置变更生效
- 端到端验证所有已实现功能

## Impact
- Affected specs: saas-discover-enhance
- Affected code:
  - `src/hooks/useNavLayout.ts` — 发现按钮的 `hidden` 条件依赖 `showMarket` flag
  - `packages/app-config/src/featureFlags/schema.ts` — `market` flag 默认值
  - `src/proxy.ts` — middleware matcher
  - `src/libs/next/nextjsOnlyRoutes.ts` — SPA 路由配置
  - `src/libs/next/config/define-config.ts` — 重定向规则

## ADDED Requirements

### Requirement: 发现按钮必须可见
系统应当确保发现按钮对所有已登录用户可见，不依赖于 `showMarket` feature flag 的值。

#### Scenario: 用户查看导航栏发现按钮
- **WHEN** 任意已登录用户打开应用
- **THEN** 导航栏在首页和任务按钮之间显示「发现」按钮
- **AND** 点击后跳转到 `/discover/agent`

#### Scenario: showMarket 为 false 时发现按钮仍可见
- **WHEN** `showMarket` feature flag 为 false
- **THEN** 社区按钮隐藏，但发现按钮仍然可见
- **AND** 发现按钮的显隐仅受导航可见性配置（`isNavVisibleForRole`）控制

### Requirement: 所有已实现功能端到端可用
系统应当确保以下功能在开发环境中正常工作：
- 发现页「专家」Tab 展示已发布的单一智能体
- 发现页「专家团」Tab 展示已发布的智能体群组
- 管理员可在群组编辑页发布/取消发布群组到发现页
- 群组详情页可查看群组详情和安装群组
- 设置页（外观）的导航可见性配置可正常使用

## MODIFIED Requirements

### Requirement: 发现按钮显隐逻辑
原逻辑：`hidden: !showMarket || !isNavVisibleForRole('discover')`
修改为：`hidden: !isNavVisibleForRole('discover')`，发现按钮不再受 `showMarket` 控制，仅受导航可见性配置控制。`showMarket` 仍然控制社区按钮的显隐。
