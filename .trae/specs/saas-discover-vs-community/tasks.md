# 发现页与社区页分离 - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 扩展 RBAC 权限系统 - 新增发布权限
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 在 `PERMISSION_ACTIONS` 中新增 `AGENT_PUBLISH` 权限 action
  - vip_user 角色新增 `agent:publish:owner` 权限
  - super_admin 自动拥有 `agent:publish:all`（通过现有全权限逻辑）
  - free_user 不添加发布权限
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-1.1: vip_user 角色权限列表包含 `agent:publish:owner`
  - `programmatic` TR-1.2: free_user 角色权限列表不包含任何 `agent:publish` 权限
  - `programmatic` TR-1.3: super_admin 拥有 `agent:publish:all`
- **Notes**: 修改 `packages/const/src/rbac.ts` 中的 `PERMISSION_ACTIONS` 和 `SYSTEM_ROLE_PERMISSIONS`

## [ ] Task 2: 后端 - 发布权限校验扩展（支持 owner 级别）
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 修改 `publishAsOfficialAgent` 和 `unpublishOfficialAgent` 的权限校验
  - 从单一的 `withRbacPermission('agent:update:all')` 改为支持两种权限路径：
    - `agent:update:all`（管理员，可发布/下架任意智能体）
    - `agent:publish:owner`（VIP 用户，只能发布/下架自己创建的智能体）
  - 实现方式：在 procedure 内部先判断是否有 all 权限，没有则判断是否有 owner 权限且智能体属于当前用户
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-7
- **Test Requirements**:
  - `programmatic` TR-2.1: super_admin 可以发布任意智能体
  - `programmatic` TR-2.2: vip_user 可以发布自己的智能体
  - `programmatic` TR-2.3: vip_user 不能发布别人的智能体（返回 403）
  - `programmatic` TR-2.4: free_user 不能发布任何智能体（返回 403）
  - `programmatic` TR-2.5: 重复发布不会报错，幂等
- **Notes**: 修改 `apps/server/src/routers/lambda/agent.ts` 中的 publish/unpublish procedure

## [ ] Task 3: 社区页数据源恢复为官方 API
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 将 `/community/agent` 的数据源从 `officialAgentService` 恢复为 LobeHub 官方 Market API
  - 恢复为 Phase 1 之前的实现（使用 `useDiscoverStore.useAssistantList` 或 `discoverService`）
  - 保留 OfficialList 组件代码（迁移到发现页用）
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgement` TR-3.1: 管理员访问 `/community/agent` 显示 LobeHub 官方社区智能体
  - `programmatic` TR-3.2: 页面数据源走 Market API，不走本地 officialAgentService
- **Notes**: 修改 `src/routes/(main)/community/(list)/agent/Client.tsx`

## [ ] Task 4: 新建发现页列表页
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - 新建路由 `/discover/agent`
  - 页面展示本地 `visibility='official'` 的智能体列表
  - 复用从社区页迁移过来的 `OfficialAgentList` 组件（卡片列表、搜索、分页、安装）
  - 页面结构与社区页类似但简化（只有智能体 tab）
  - 路由注册到 desktop 两个 config 文件
- **Acceptance Criteria Addressed**: AC-3, AC-8
- **Test Requirements**:
  - `human-judgement` TR-4.1: 访问 `/discover/agent` 显示本地官方智能体列表
  - `human-judgement` TR-4.2: 搜索和分页功能正常
  - `human-judgement` TR-4.3: 点击「使用」安装成功并跳转聊天
- **Notes**:
  - 路由文件放在 `src/routes/(main)/discover/agent/`
  - 遵循 roots vs features 约定

## [ ] Task 4a: 发现页智能体详情页
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - 新建路由 `/discover/agent/[agentId]`
  - 沿用现有社区详情页的 UI 结构和组件模式
  - 数据源替换为本地官方智能体详情（`getOfficialAgent`）
  - 详情页包含：智能体介绍、系统提示词、能力概览、内置技能/知识库等
  - 侧边栏操作按钮：「使用 / 添加到我的智能体」（安装并跳转聊天）
  - 路由注册到 desktop 两个 config 文件
- **Acceptance Criteria Addressed**: AC-3a, AC-8
- **Test Requirements**:
  - `human-judgement` TR-4a.1: 点击列表卡片进入详情页，展示完整智能体信息
  - `human-judgement` TR-4a.2: 详情页各区块（概览、系统提示词、能力等）正常渲染
  - `human-judgement` TR-4a.3: 点击「使用」安装成功并跳转聊天
- **Notes**:
  - 复用社区详情页的布局组件和样式
  - 数据源从 Market API 切换为本地 official agent service

## [ ] Task 4b: 移动端适配
- **Priority**: medium
- **Depends On**: Task 4, Task 4a
- **Description**:
  - 发现页（列表 + 详情）在移动端正常展示，布局与社区页移动端一致
  - 社区页移动端权限控制：非管理员访问被重定向
  - 移动端导航入口遵循权限规则
  - 路由注册到 mobileRouter.config.tsx
- **Acceptance Criteria Addressed**: AC-3b
- **Test Requirements**:
  - `human-judgement` TR-4b.1: 移动端访问发现页列表正常显示
  - `human-judgement` TR-4b.2: 移动端访问发现页详情页正常显示
  - `human-judgement` TR-4b.3: 移动端社区页非管理员访问被重定向
- **Notes**:
  - 参考现有社区页的移动端实现方式
  - 移动端路由配置在 `src/spa/router/mobileRouter.config.tsx`

## [ ] Task 5: 导航入口调整
- **Priority**: high
- **Depends On**: Task 4, Task 4a
- **Description**:
  - 左侧导航新增「发现」按钮，所有登录用户可见（用 `showMarket` 或新增 flag）
  - 「社区」按钮改为仅管理员可见（用 `usePermission('manage_official_agents')` 或类似权限判断）
  - 导航顺序：发现在前，社区在后（仅管理员看到社区）
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `human-judgement` TR-5.1: free_user 登录只看到「发现」按钮，看不到「社区」
  - `human-judgement` TR-5.2: vip_user 登录只看到「发现」按钮，看不到「社区」
  - `human-judgement` TR-5.3: super_admin 登录同时看到「发现」和「社区」按钮
- **Notes**: 修改 `src/hooks/useNavLayout.ts`

## [ ] Task 6: 社区页访问权限保护
- **Priority**: medium
- **Depends On**: Task 5
- **Description**:
  - 为社区页添加权限保护：非管理员访问 `/community/*` 时重定向到首页或展示 403
  - 实现方式：在社区 layout 或社区 page 中加权限检查 hook
  - 保护范围：整个 `/community/` 路径下的所有页面
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-6.1: free_user 直接访问 `/community/agent` 被重定向
  - `human-judgement` TR-6.2: vip_user 直接访问 `/community/agent` 被重定向
  - `human-judgement` TR-6.3: super_admin 可以正常访问
- **Notes**: 在社区 layout 中添加权限守卫组件

## [ ] Task 7: 前端发布权限适配
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 更新 `usePermission` hook 的 action 映射，新增 `manage_official_agents` 或 `publish_agent` 等 action
  - 智能体编辑页的发布菜单项可见性判断：管理员 OR（VIP 且智能体是自己的）
  - 调整菜单项文案：从「发布为官方智能体」改为「发布到发现页」
- **Acceptance Criteria Addressed**: AC-4, AC-6
- **Test Requirements**:
  - `human-judgement` TR-7.1: super_admin 在任意智能体编辑页看到发布菜单项
  - `human-judgement` TR-7.2: vip_user 在自己的智能体编辑页看到发布菜单项
  - `human-judgement` TR-7.3: vip_user 在别人的智能体编辑页看不到（如果能看到的话）
  - `human-judgement` TR-7.4: free_user 看不到发布菜单项
- **Notes**: 修改 `src/hooks/usePermission.ts` 和智能体编辑页 Header 菜单

## [ ] Task 8: i18n 文案调整
- **Priority**: medium
- **Depends On**: Task 4, Task 4a, Task 7
- **Description**:
  - 新增发现页相关 i18n key（页面标题、空状态等）
  - 调整发布相关文案（从"官方"改为"发现页"）
  - en-US 和 zh-CN 双语
- **Acceptance Criteria Addressed**: AC-3, AC-4
- **Test Requirements**:
  - `human-judgement` TR-8.1: 发现页文案正确显示
  - `human-judgement` TR-8.2: 发布相关文案为"发现页"而非"官方"
- **Notes**: 修改 `packages/locales/src/default/discover.ts` 及对应 locale 文件

## [ ] Task 9: 类型检查和集成验证
- **Priority**: high
- **Depends On**: Task 1-8, Task 4a, Task 4b
- **Description**:
  - 运行 `bun run type-check` 确保无类型错误
  - 手动验证完整流程：管理员发布 → 免费用户浏览发现页 → 查看详情 → 安装使用
  - 验证权限边界：VIP 发布自己的、不能发别人的；免费用户看不到发布入口
  - 验证移动端显示正常
- **Acceptance Criteria Addressed**: AC-1 到 AC-8, AC-3a, AC-3b 全部
- **Test Requirements**:
  - `programmatic` TR-9.1: 类型检查通过（exit 0）
  - `human-judgement` TR-9.2: 完整流程走通（列表 → 详情 → 安装 → 聊天）
  - `human-judgement` TR-9.3: 各角色权限边界正确
  - `human-judgement` TR-9.4: 移动端显示正常
