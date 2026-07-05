# 发现页详情增强与发布修复 Spec

## Why
1. 群组发布到发现页失败：`publishAsOfficial` 模型方法内部有 ownership 检查，super_admin 虽有 `group:publish:all` 权限，但无法发布非自己创建的群组
2. 发现页详情页显示完整系统提示词，应改为概览式展示（类似社区页 `/community/agent/:id`）
3. 缺少更新/升级按钮，管理员/VIP 修改 agent 或 group 后无法便捷地重新发布
4. VIP 用户发布 agent/group 需要超级管理员审核，不能直接发布到发现页

## What Changes
- 修复 `publishAsOfficial` 方法：super_admin（有 `group:publish:all` / `agent:update:all` 权限）跳过 ownership 检查
- 重写发现页 agent 详情页：参照社区页样式，显示概览（摘要、开场白、示例对话），不显示完整系统提示词
- 重写发现页 group 详情页：参照社区页样式，显示概览和成员列表，不显示完整系统提示词
- 在 agent 编辑页和 group 编辑页增加「更新到发现页」按钮，便于已发布的 agent/group 修改后重新发布
- **新增审核流程**：VIP 用户发布/更新 agent/group 时，进入 `pending_review` 状态，super admin 审核通过后才发布到发现页
- **新增审核管理页面**：super admin 专用页面，查看待审核列表，批准/拒绝发布请求

## Impact
- Affected code:
  - `packages/database/src/models/chatGroupShare.ts` — 修复 `publishAsOfficial`，新增审核相关方法
  - `packages/database/src/models/agentShare.ts` — 修复 `publishAsOfficial`，新增审核相关方法
  - `packages/database/src/schemas/chatGroupShare.ts` — visibility 增加 `pending_review` 状态
  - `packages/database/src/schemas/agentShare.ts` — visibility 增加 `pending_review` 状态
  - `apps/server/src/routers/lambda/agentGroup.ts` — 修改发布逻辑，新增审核 procedures
  - agent 发布路由 — 修改发布逻辑，新增审核 procedures
  - `src/routes/(main)/discover/agent/[agentId]/index.tsx` — 重写详情页
  - `src/routes/(main)/discover/group/[groupId]/index.tsx` — 重写详情页
  - `src/routes/(main)/agent/profile/features/Header/index.tsx` — 增加更新按钮，VIP 显示"提交审核"
  - `src/routes/(main)/group/profile/features/Header/index.tsx` — 增加更新按钮，VIP 显示"提交审核"
  - **新增** `src/routes/(main)/settings/review/` — super admin 审核管理页面
  - **新增**审核相关 i18n key

## ADDED Requirements

### Requirement: 管理员发布跳过 ownership 检查
super_admin（有 `group:publish:all` 或 `agent:update:all` 权限）发布任何 agent/group 到发现页时，SHALL 跳过 ownership 检查，直接执行发布操作。

#### Scenario: 管理员发布非自己创建的群组
- **WHEN** super_admin 点击发布非自己创建的群组
- **THEN** 发布成功，群组出现在发现页专家团 Tab

#### Scenario: VIP 用户只能发布自己的群组
- **WHEN** VIP 用户（仅有 `group:publish:owner` 权限）点击发布非自己的群组
- **THEN** 发布失败，返回权限错误

### Requirement: VIP 发布审核流程
VIP 用户发布/更新 agent/group 到发现页时，SHALL 进入 `pending_review` 审核状态，不会直接出现在发现页。super admin 审核通过后才发布到发现页。

#### Scenario: VIP 用户提交发布申请
- **WHEN** VIP 用户点击「提交审核」按钮
- **THEN** agent/group 的 visibility 设为 `pending_review`，显示"等待审核"状态
- **AND** super admin 审核页面出现该审核请求

#### Scenario: Super admin 审核通过
- **WHEN** super admin 在审核页面点击「批准」
- **THEN** agent/group 的 visibility 改为 `official`，出现在发现页
- **AND** VIP 用户看到审核通过状态

#### Scenario: Super admin 审核拒绝
- **WHEN** super admin 在审核页面点击「拒绝」
- **THEN** agent/group 的 visibility 改回 `private`，不会出现在发现页
- **AND** VIP 用户看到审核拒绝状态

### Requirement: Super admin 直接发布无需审核
super_admin 发布 agent/group 时 SHALL 直接发布到发现页，无需审核。

#### Scenario: 管理员直接发布
- **WHEN** super_admin 点击「发布到发现页」
- **THEN** 直接发布，visibility 设为 `official`，无需审核

### Requirement: 发现页 Agent 详情页概览式展示
发现页 agent 详情页 SHALL 显示概览信息（头像、标题、描述、标签、开场白、示例对话），SHALL NOT 显示完整系统提示词。样式参照社区页 `/community/agent/:id`。

#### Scenario: 用户查看 agent 详情
- **WHEN** 用户从发现页点击进入 agent 详情页
- **THEN** 显示概览信息（摘要、开场白、示例对话），不显示系统提示词

### Requirement: 发现页 Group 详情页概览式展示
发现页 group 详情页 SHALL 显示概览信息（头像、标题、描述、成员列表），SHALL NOT 显示完整系统提示词。样式参照社区页 agent 详情页。

#### Scenario: 用户查看 group 详情
- **WHEN** 用户从发现页点击进入 group 详情页
- **THEN** 显示概览信息和成员列表，不显示系统提示词

### Requirement: 更新到发现页按钮
agent 编辑页和 group 编辑页 SHALL 增加「更新到发现页」按钮，仅对已发布的 agent/group 显示，便于管理员/VIP 修改后重新发布。

#### Scenario: 管理员修改已发布的 agent 后更新
- **WHEN** 管理员修改已发布的 agent 并点击「更新到发现页」
- **THEN** agent 信息更新到发现页，显示成功提示

#### Scenario: VIP 用户修改已发布的 agent 后更新
- **WHEN** VIP 用户修改已发布的 agent 并点击「提交更新审核」
- **THEN** 提交审核请求，显示"等待审核"状态

### Requirement: Super admin 审核管理页面
系统 SHALL 提供审核管理页面（`/settings/review`），仅 super_admin 可访问，显示所有待审核的 agent/group 发布请求列表。

#### Scenario: 管理员查看待审核列表
- **WHEN** super_admin 访问 `/settings/review`
- **THEN** 显示待审核的 agent/group 列表，每项显示名称、提交者、提交时间
- **AND** 每项有「批准」和「拒绝」按钮

#### Scenario: 非管理员访问审核页面
- **WHEN** 非 super_admin 用户访问 `/settings/review`
- **THEN** 重定向到其他页面或显示无权限提示
