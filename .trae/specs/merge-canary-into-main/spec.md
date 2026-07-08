# Merge Canary into Main Spec

## Why

远程仓库 `private/canary` 已领先 `private/main` 11,901 个提交，包含 LobeHub 上游的最新功能（memory、skills、agent-runtime、eval 等模块）。需要将 canary 合并进 main，同时确保之前开发的商业 SaaS 功能（RBAC、会员体系、计费、管理后台等）不被覆盖。

已有 `merge/canary-into-main` 分支使用 `--allow-unrelated-histories -Xtheirs` 策略完成了合并。经分析，该分支**基本成功**，但存在一个关键安全风险：RBAC 权限中间件被替换成了 no-op stub。

## What Changes

- **修复被覆盖的 RBAC 权限中间件**：`packages/business-server/src/trpc-middlewares/rbacPermission.ts` 从 canary 的 no-op stub 恢复为 main 的完整权限检查实现
- **验证其他 SaaS 功能完整性**：检查 189 个 SaaS 相关共同修改文件的内容是否被覆盖
- **运行类型检查**：确保合并后的代码通过 TypeScript 编译
- **推送合并结果**：将修复后的 `merge/canary-into-main` 推送到 `private/main`

## Impact

- **受影响系统**：RBAC 权限系统、管理后台、会员/计费体系
- **关键文件**：`packages/business-server/src/trpc-middlewares/rbacPermission.ts`
- **合并范围**：11,901 个 canary 提交 + 46 个 main 特有提交

## ADDED Requirements

### Requirement: 合并验证与修复

The system SHALL merge canary into main while preserving all SaaS functionality.

#### Scenario: RBAC 权限中间件恢复

- **GIVEN** `merge/canary-into-main` 分支上 `rbacPermission.ts` 是 no-op stub
- **WHEN** 恢复 main 版本的完整权限检查逻辑
- **THEN** `withRbacPermission`、`withAnyRbacPermission`、`withAllRbacPermissions`、`withScopedPermission` 恢复完整实现
- **AND** isRoot 短路逻辑保留
- **AND** workspace 权限检查保留

#### Scenario: SaaS 功能完整性验证

- **GIVEN** 189 个 SaaS 相关文件在 canary 和 main 之间共同修改
- **WHEN** 验证这些文件在 merge 分支上的内容
- **THEN** 核心计费、会员、RBAC 数据库 schema、管理后台页面文件内容保持不变

#### Scenario: 类型检查通过

- **GIVEN** 合并后的代码库
- **WHEN** 运行 `bun run type-check`
- **THEN** 无类型错误（或错误仅来自 canary 上游已知问题）

#### Scenario: 推送合并结果

- **GIVEN** 修复后的 merge 分支
- **WHEN** 推送到 `private/main`
- **THEN** `private/main` 包含 canary 所有提交 + main 的 SaaS 功能

## MODIFIED Requirements

### Requirement: RBAC Permission Middleware

**原有实现**：完整的权限检查中间件，包含数据库查询、isRoot 短路、workspace 作用域检查。

**修改后**：恢复原有完整实现，保留 canary 上游对此文件的任何无关改动（如 import 路径调整）。
