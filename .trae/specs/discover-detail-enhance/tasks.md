# Tasks

- [x] Task 1: 修复管理员发布失败问题
  - [x] 修改 `packages/database/src/models/chatGroupShare.ts` 的 `publishAsOfficial` 方法：接受 `skipOwnershipCheck` 参数，为 true 时跳过 ownership 检查
  - [x] 修改 `packages/database/src/models/agentShare.ts` 的 `publishAsOfficial` 方法：同上
  - [x] 修改 `apps/server/src/routers/lambda/agentGroup.ts` 的 `publishAsOfficialGroup` procedure：当 `canPublishAll` 为 true 时，传入 `skipOwnershipCheck: true`
  - [x] 修改 agent 发布路由：同上逻辑
  - [x] 验证：管理员可以发布非自己创建的 agent/group

- [x] Task 2: 新增 VIP 发布审核流程（后端）
  - [x] 修改 `packages/database/src/schemas/chatGroupShare.ts` 和 `agentShare.ts` 的 visibility 注释，增加 `pending_review` 状态（无需修改数据库，text 字段即可）
  - [x] 在 `chatGroupShare.ts` 和 `agentShare.ts` 模型中新增 `submitForReview` 方法：设置 visibility 为 `pending_review`
  - [x] 在 `chatGroupShare.ts` 和 `agentShare.ts` 模型中新增 `approveReview` 方法：设置 visibility 为 `official`
  - [x] 在 `chatGroupShare.ts` 和 `agentShare.ts` 模型中新增 `rejectReview` 方法：设置 visibility 为 `private`
  - [x] 在 `chatGroupShare.ts` 和 `agentShare.ts` 模型中新增 `getPendingReviews` 方法：查询所有 `pending_review` 状态的记录
  - [x] 修改 `apps/server/src/routers/lambda/agentGroup.ts`：VIP 发布时调用 `submitForReview`，super_admin 直接调用 `publishAsOfficial`
  - [x] 新增 `approveGroupReview` 和 `rejectGroupReview` procedure：仅 super_admin 可调用
  - [x] 新增 `getPendingGroupReviews` procedure：仅 super_admin 可调用
  - [x] agent 发布路由同样处理

- [x] Task 3: 重写发现页 Agent 详情页
  - [x] 参照社区页 `src/routes/(main)/community/(detail)/agent/` 的结构，重写 `src/routes/(main)/discover/agent/[agentId]/index.tsx`
  - [x] Header 区域：头像 + 标题 + 描述 + 使用按钮（参照社区页 Header 样式）
  - [x] 概览区域：摘要 Collapse + 开场白示例对话 Block（参照社区页 Overview 组件）
  - [x] 不显示系统提示词区域
  - [x] 保留安装/使用功能按钮

- [x] Task 4: 重写发现页 Group 详情页
  - [x] 参照社区页 agent 详情页结构，重写 `src/routes/(main)/discover/group/[groupId]/index.tsx`
  - [x] Header 区域：群组头像 + 标题 + 描述 + 成员数量 + 使用按钮
  - [x] 概览区域：群组摘要 + 成员列表（显示每个成员的头像、标题、描述，不显示系统提示词）
  - [x] 不显示成员的系统提示词

- [x] Task 5: 增加发布/更新按钮（区分管理员和 VIP）
  - [x] 在 `src/routes/(main)/agent/profile/features/Header/index.tsx` 更多菜单中：
    - super_admin：显示「发布到发现页」/「更新到发现页」/「取消发布」
    - VIP：显示「提交审核」/「提交更新审核」
    - 已发布且为 VIP：显示「已发布」状态 + 「提交更新审核」
  - [x] 在 `src/routes/(main)/group/profile/features/Header/index.tsx` 更多菜单中：同上逻辑
  - [x] 显示审核状态（pending_review 时显示"等待审核"标签）
  - [x] 新增 i18n key

- [x] Task 6: 新增 Super admin 审核管理页面
  - [x] 创建 `src/routes/(main)/settings/review/index.tsx` 审核管理页面
  - [x] 创建 `src/features/Review/` 审核列表组件
  - [x] 显示待审核的 agent/group 列表（名称、提交者、提交时间、类型）
  - [x] 每项有「批准」和「拒绝」按钮
  - [x] 仅 super_admin 可访问（权限守卫）
  - [x] 在设置页侧边栏增加「审核管理」入口（仅 super_admin 可见）
  - [x] 新增 i18n key

- [x] Task 7: 类型检查与验证
  - [x] 运行 `bun run type-check` 确保无类型错误
  - [x] 验证管理员发布功能正常
  - [x] 验证 VIP 提交审核流程正常
  - [x] 验证审核管理页面正常
  - [x] 验证详情页样式与社区页一致

# Task Dependencies
- Task 1 独立，最高优先级
- Task 2 依赖 Task 1（发布逻辑修复后才能加审核流程）
- Task 3 和 Task 4 互相独立，可并行
- Task 5 依赖 Task 1 和 Task 2（发布和审核逻辑都需要）
- Task 6 依赖 Task 2（审核后端 API）
- Task 7 依赖所有前置任务完成
