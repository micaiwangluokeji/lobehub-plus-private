# 发现页与社区页分离 - Product Requirement Document

## Overview
- **Summary**: 将现有的单一"社区/发现"页拆分为两个独立页面：`/community`（LobeHub 官方社区，仅管理员可见）和 `/discover`（平台官方智能体商店，所有登录用户可见）。
- **Purpose**: 满足 SaaS 平台运营需求——平台运营者（管理员）可以访问 LobeHub 官方社区寻找灵感；普通用户只能看到本平台运营的官方智能体商店；VIP 用户可以将自己创建的智能体发布到发现页，形成平台内生态。
- **Target Users**: super_admin（管理员）、vip_user（VIP 用户）、free_user（免费用户）

## Goals
- `/community/agent` 数据源恢复为 LobeHub 官方 Market API，整个社区页及导航入口仅 super_admin 可见
- 新建 `/discover/agent` 发现页，展示平台内管理员和 VIP 发布的官方智能体（本地数据库 `visibility='official'`）
- 发现页包含智能体列表页和详情页，沿用现有社区详情页模式
- 移动端适配：发现页和社区页保持一致的移动端行为
- 发布功能扩展：VIP 用户也可以发布自己的智能体到发现页（仅限自己创建的）
- 左侧导航：所有登录用户显示「发现」按钮；只有管理员额外显示「社区」按钮
- 发布的智能体只在发现页展示，不会同步到 LobeHub 官方社区

## Non-Goals (Out of Scope)
- 社区页智能体详情页（`/community/agent/[identifier]`）的改造（保持官方 API 数据源不变）
- 订阅/计费系统（VIP 角色已存在，本期不改支付流程）
- 智能体审核流程（发布即上线，无需审核）

## Background & Context

**当前状态（Phase 1 改动后）**：
- `/community/agent` 数据源已改为本地 `officialAgentService.getOfficialAgents()`（本地 visibility='official' 的智能体）
- 社区导航入口对所有用户可见（通过 `showMarket` feature flag 控制）
- 只有 super_admin 能发布为官方智能体（`agent:update:all` 权限）
- `agent_shares.visibility` 字段支持 `'official'` 值
- 三级角色已建立：super_admin / vip_user / free_user

**本次要做的事**：
1. 社区页改回 LobeHub 官方 API，限制管理员可见
2. 新建发现页，放本地 official agent，所有人可见
3. 扩展发布权限，VIP 也能发自己的

## Functional Requirements

### FR-1: 社区页（/community）仅管理员可见
- 左侧导航「社区」按钮：只有 super_admin 能看到
- 直接访问 `/community/*` 路径时，非管理员返回 403 或重定向到首页
- 社区页数据源恢复为 LobeHub 官方 Market API（即 Phase 1 之前的实现）

### FR-2: 新建发现页（/discover/agent）
- 路由 `/discover/agent`，展示本地 `visibility='official'` 的智能体列表
- 所有登录用户均可访问和浏览
- 支持搜索、分页（沿用现有官方智能体列表的功能）
- 卡片展示：头像、标题、描述、发布时间、安装按钮
- 点击「使用」按钮安装智能体到用户个人空间（幂等检测）

### FR-2a: 发现页智能体详情页
- 路由 `/discover/agent/[agentId]`，展示发布到发现页的智能体详情
- 沿用现有社区详情页模式：智能体介绍、系统提示词、能力概览、技能/知识库等
- 详情页包含「使用 / 添加到我的智能体」按钮，点击安装并跳转聊天
- 数据源为本地 `visibility='official'` 的智能体详细信息

### FR-2b: 移动端适配
- 发现页（列表 + 详情）保持与社区页一致的移动端行为
- 社区页移动端同样仅管理员可见（权限逻辑与桌面端一致）
- 移动端导航入口同样遵循权限规则

### FR-3: 发现页导航入口
- 左侧导航新增「发现」按钮，所有登录用户可见
- 点击跳转到 `/discover/agent`

### FR-4: VIP 用户可发布智能体到发现页
- 发布权限从 `agent:update:all`（仅 super_admin）扩展为 `agent:update:all` OR `agent:publish:owner`
- VIP 用户拥有 `agent:publish:owner` 权限，可以发布**自己创建的**智能体到发现页
- super_admin 可以发布**任意**智能体
- 发布入口：智能体编辑页右上角 `⋯` 菜单中的「发布到发现页」/「从发现页下架」
- 下架权限同上（谁发布谁下架 + 管理员可下架所有）

### FR-5: 数据隔离
- 发布到发现页的智能体仅存储在本地 `agent_shares` 表（`visibility='official'`）
- **不会**调用 LobeHub 官方 Market API 进行同步
- 每个用户安装的智能体数据严格隔离（已有保障）

## Non-Functional Requirements

- **NFR-1**: 权限校验在后端强制执行，前端隐藏入口只是 UX 优化
- **NFR-2**: 发现页首屏加载时间 < 2s（20 条数据以内）
- **NFR-3**: 发布/下架操作幂等，重复操作不会报错
- **NFR-4**: 遵循现有代码风格和目录结构约定

## Constraints
- **Technical**: Next.js 16 + React 19 + TypeScript、Drizzle ORM + PostgreSQL、tRPC、Zustand、遵循 AGENTS.md 的代码规范
- **Business**: 不能破坏现有社区页的其他功能（如 MCP、模型、插件等 tab）
- **Dependencies**: 依赖 Phase 1 已建立的 RBAC 系统和 `agent_shares` 表

## Assumptions
- VIP 用户发布的智能体默认为「已发布」状态，无需审核（后续可加审核流程）
- 发现页暂时只有智能体列表和详情，没有 MCP/模型/插件等其他 tab（后续可扩展）
- 社区页的其他 tab（MCP、模型、插件等）保持官方 API 数据源，且同样仅管理员可见
- 发布到发现页的智能体，原作者可以编辑和更新，编辑后自动同步到发现页
- 发现页详情页沿用社区详情页的 UI 组件结构，仅替换数据源
- 移动端通过 Vite 的 mobile entry 已有路由机制适配

## Acceptance Criteria

### AC-1: 社区页仅管理员可见
- **Given**: 用户已登录且角色为 free_user 或 vip_user
- **When**: 用户访问 `/community/agent`
- **Then**: 页面重定向到首页或展示 403；左侧导航看不到「社区」按钮
- **Verification**: `human-judgment`

### AC-2: 管理员可以正常使用社区页
- **Given**: 用户已登录且角色为 super_admin
- **When**: 用户访问 `/community/agent`
- **Then**: 页面展示 LobeHub 官方社区智能体列表（来自 Market API）；左侧导航显示「社区」按钮
- **Verification**: `human-judgment`

### AC-3: 发现页所有登录用户可见
- **Given**: 用户已登录（任意角色）
- **When**: 用户访问 `/discover/agent`
- **Then**: 页面展示平台官方智能体列表（本地 visibility='official' 的数据）；左侧导航显示「发现」按钮
- **Verification**: `human-judgment`

### AC-3a: 发现页智能体详情页
- **Given**: 用户已登录，发现页有已发布的智能体
- **When**: 用户点击智能体卡片进入详情页 `/discover/agent/[agentId]`
- **Then**: 展示智能体详情（介绍、系统提示词、能力等）；包含「使用」按钮可安装
- **Verification**: `human-judgment`

### AC-3b: 移动端适配
- **Given**: 用户在移动设备上访问
- **When**: 访问发现页和社区页
- **Then**: 页面布局与现有社区页移动端一致；导航入口权限规则与桌面端一致
- **Verification**: `human-judgment`

### AC-4: VIP 用户可以发布自己的智能体到发现页
- **Given**: 用户已登录且角色为 vip_user，拥有一个自己创建的智能体
- **When**: 用户进入智能体编辑页，点击右上角菜单
- **Then**: 能看到「发布到发现页」菜单项；点击后该智能体出现在发现页列表中
- **Verification**: `human-judgment`

### AC-5: VIP 用户不能发布别人的智能体
- **Given**: 用户已登录且角色为 vip_user
- **When**: 用户尝试发布不属于自己的智能体（通过 API 调用）
- **Then**: 后端返回 403 错误
- **Verification**: `programmatic`

### AC-6: 普通用户不能发布
- **Given**: 用户已登录且角色为 free_user
- **When**: 用户进入任意智能体编辑页
- **Then**: 看不到「发布到发现页」菜单项；直接调用 API 返回 403
- **Verification**: `programmatic`

### AC-7: 发布幂等
- **Given**: 一个智能体已经发布到发现页
- **When**: 再次点击「发布到发现页」
- **Then**: 不会报错，状态保持为已发布
- **Verification**: `programmatic`

### AC-8: 发现页安装功能正常
- **Given**: 用户已登录，发现页有已发布的智能体
- **When**: 用户点击「使用」按钮
- **Then**: 智能体被复制到用户个人空间，跳转到聊天页；重复点击不会重复创建
- **Verification**: `human-judgment`

## Open Questions
- [ ] VIP 用户发布的智能体，管理员可以下架吗？（默认：可以，管理员有 `agent:update:all` 全权限）
- [ ] 发现页的 URL 路径用 `/discover/agent` 还是 `/market/agent`？（默认：`/discover/agent`）
- [ ] 社区页的其他 tab（MCP、模型、插件等）也仅管理员可见吗？还是只限制 agent tab？（默认：整个 /community 路径都仅管理员可见）
