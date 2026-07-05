---
name: 修复群组发布到发现页失败问题
overview: 调查并修复在群组页面点击"发布到发现页"按钮时出现的数据库错误。对比agent和群组的发布逻辑，找出根本原因并修复。
todos:
  - id: create-migration-sql
    content: 创建数据库迁移文件 0116_add_accessed_at_to_chat_group_shares.sql
    status: completed
  - id: update-journal
    content: 更新 _journal.json 添加新迁移记录
    status: completed
    dependencies:
      - create-migration-sql
  - id: create-snapshot
    content: 创建 0116_snapshot.json 数据库快照文件
    status: completed
    dependencies:
      - update-journal
  - id: execute-migration
    content: 执行数据库迁移命令 drizzle:migrate
    status: completed
    dependencies:
      - create-snapshot
  - id: verify-fix
    content: 验证修复：检查表结构并测试发布功能
    status: completed
    dependencies:
      - execute-migration
  - id: write-fix-doc
    content: 编写修复文档记录问题根源和修复步骤
    status: completed
    dependencies:
      - verify-fix
---

## 产品概述

修复群组页面"发布到发现页"功能报错的问题。当前在 `/group/cg_wqiWgqz9mSHD/profile` 页面点击发布按钮时出现数据库 SQL 错误，而 Agent 页面的相同功能正常工作。

## 核心功能

- 修复 `chat_group_shares` 表缺少 `accessed_at` 字段的问题
- 确保群组发布功能正常工作
- 编写详细的修复文档，记录问题根源和修复步骤

## 技术栈

- 数据库：PostgreSQL
- ORM：Drizzle ORM
- 迁移管理：Drizzle Kit

## 实现方案

### 根本原因

1. **数据库表结构不一致**：

- `agent_shares` 表（正常工作）：迁移文件 `0105` 创建时包含 `accessed_at` 字段
- `chat_group_shares` 表（报错）：迁移文件 `0115_add_chat_group_shares.sql` 创建时**缺少 `accessed_at` 字段**

2. **Schema 定义问题**：

- `chatGroupShares` schema 使用了 `...timestamps`
- `timestamps` 包含三个字段：`accessedAt`、`createdAt`、`updatedAt`
- 但实际的数据库表只有 `created_at` 和 `updated_at`

3. **错误触发机制**：

- Drizzle ORM 根据 schema 定义生成 INSERT SQL
- SQL 包含 `accessed_at` 字段
- 数据库表没有这个字段，导致 SQL 执行失败

### 修复步骤

#### Step 1: 创建数据库迁移文件

创建 `packages/database/migrations/0116_add_accessed_at_to_chat_group_shares.sql`：

```sql
-- 添加 accessed_at 字段到 chat_group_shares 表
-- Date: 2026-07-02
-- Reason: 原迁移文件创建表时缺少 accessed_at 字段，导致 Drizzle ORM 操作失败

ALTER TABLE "chat_group_shares" ADD COLUMN "accessed_at" timestamp with time zone DEFAULT now() NOT NULL;
```

#### Step 2: 更新 migration meta

更新 `packages/database/migrations/meta/_journal.json`，添加新的迁移记录。

创建 `packages/database/migrations/meta/0116_snapshot.json` 快照文件。

#### Step 3: 执行数据库迁移

```
cd packages/database
bun run drizzle:migrate
```

#### Step 4: 验证修复

1. 检查数据库表结构，确认 `accessed_at` 字段已添加
2. 测试群组发布功能
3. 确认错误消失

## 实施注意事项

### 性能考虑

- `ALTER TABLE ... ADD COLUMN` 操作在 PostgreSQL 中很快，因为新列有默认值
- 已存在的记录会自动填充当前时间作为 `accessed_at`

### 向后兼容

- 添加字段使用 `DEFAULT now() NOT NULL`，不影响现有数据
- 不需要数据迁移或转换

### 安全检查

- 在生产环境执行前，应在测试环境验证
- 建议备份数据库 before 执行迁移

## 目录结构

```
packages/database/
├── migrations/
│   ├── 0115_add_chat_group_shares.sql          # [EXISTING] 原迁移文件（缺少 accessed_at）
│   ├── 0116_add_accessed_at_to_chat_group_shares.sql  # [NEW] 修复迁移
│   └── meta/
│       ├── _journal.json                        # [MODIFY] 添加新迁移记录
│       └── 0116_snapshot.json                 # [NEW] 数据库快照
```

## 关键代码结构

### Schema 定义（已正确，无需修改）

```typescript
// packages/database/src/schemas/chatGroupShare.ts
export const chatGroupShares = pgTable(
  'chat_group_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chatGroupId: text('chat_group_id').notNull().references(() => chatGroups.id, { onDelete: 'cascade' }),
    visibility: text('visibility').default('private').notNull(),
    userViewCount: integer('user_view_count').default(0).notNull(),
    ...timestamps,  // ← 这里展开为 accessedAt, createdAt, updatedAt
  },
  (t) => [...]
);
```

### Timestamps 定义（已正确，无需修改）

```typescript
// packages/database/src/schemas/_helpers.ts
export const timestamps = {
  accessedAt: accessedAt(),   // ← 期望数据库有 accessed_at 字段
  createdAt: createdAt(),
  updatedAt: updatedAt(),
};
```