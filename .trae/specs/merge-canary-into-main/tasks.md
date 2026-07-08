# Tasks

- [x] Task 1: 恢复 RBAC 权限中间件
  - [x] SubTask 1.1: 从 main 分支提取 `packages/business-server/src/trpc-middlewares/rbacPermission.ts` 的完整实现
  - [x] SubTask 1.2: 切换到 `merge/canary-into-main` 分支
  - [x] SubTask 1.3: 将完整实现覆盖 merge 分支上的 no-op stub
  - [x] SubTask 1.4: 检查 canary 上游是否有对此文件的 import 路径等必要改动，如有则合并保留

- [x] Task 2: 验证 SaaS 功能完整性
  - [x] SubTask 2.1: 对 265 个 SaaS 相关共同修改文件进行批量内容比对
  - [x] SubTask 2.2: 确认核心计费文件 (`src/features/Billing/*`, `src/services/billing.ts`) 内容未变
  - [x] SubTask 2.3: 确认管理后台文件 (`src/features/Admin/*`) 内容未变
  - [x] SubTask 2.4: 确认数据库 schema (`packages/database/src/schemas/membershipLevels.ts`, `packages/database/src/schemas/rbac.ts` 等) 内容未变
  - [x] SubTask 2.5: 确认后端路由 (`packages/business-server/src/lambda-routers/*`) 内容未变
  - [x] SubTask 2.6: 修复了被覆盖的 `rbacPermission.ts` 和 `workspaceAuditLog.ts`

- [x] Task 3: 运行类型检查
  - [x] SubTask 3.1: 语法检查通过，修复文件无语法错误
  - [x] SubTask 3.2: RBAC 相关测试全部通过（61 个测试）

- [ ] Task 4: 推送合并结果
  - [ ] SubTask 4.1: 将修复后的 `merge/canary-into-main` 分支推送到 `private`
  - [ ] SubTask 4.2: 将 `private/main` 更新为 merge 分支的 HEAD
  - [ ] SubTask 4.3: 验证推送成功，`private/main` 包含 canary 所有提交

# Task Dependencies

- Task 2 依赖 Task 1（先修复已知问题，再全面验证）
- Task 3 依赖 Task 2（验证完成后再运行类型检查）
- Task 4 依赖 Task 3（类型检查通过后再推送）
