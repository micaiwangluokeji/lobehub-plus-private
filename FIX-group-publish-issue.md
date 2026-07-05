# 修复群组"发布到发现页"功能失败问题

## 问题描述

在群组页面 `/group/cg_wqiWgqz9mSHD/profile` 点击"发布到发现页"按钮时，出现数据库错误：

```
Failed query: insert into "chat_group_shares" ("id", "chat_group_id", "visibility", "user_view_count", "accessed_at", "created_at", "updated_at") 
values (default, $1, $2, default, default, default, default) 
on conflict ("chat_group_id") do update set "visibility" = $3, "accessed_at" = $4, "updated_at" = $5 
returning "id", "chat_group_id", "visibility", "user_view_count", "accessed_at", "created_at", "updated_at" 
params: cg_wqiWgqz9mSHD,official,official,2026-07-02T10:14:29.518Z,2026-07-02T10:14:29.518Z
```

但在 Agent 页面 `/agent/agt_5uxfk1Ro5iof/profile` 点击同样按钮却正常工作。

## 根本原因

### 1. 数据库表结构不一致

- **agent_shares 表**（正常工作）：创建时包含 `accessed_at` 字段
- **chat_group_shares 表**（报错）：创建时**缺少 `accessed_at` 字段**

### 2. 迁移文件缺陷

文件 `packages/database/migrations/0115_add_chat_group_shares.sql` 创建表时缺少 `accessed_at` 字段：

```sql
-- 原文件内容（缺少 accessed_at）
CREATE TABLE IF NOT EXISTS "chat_group_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_group_id" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"user_view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
```

### 3. Schema 定义正确

`packages/database/src/schemas/chatGroupShare.ts` 使用了 `...timestamps`，其中包含 `accessed_at` 字段：

```typescript
export const chatGroupShares = pgTable(
  'chat_group_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chatGroupId: text('chat_group_id').notNull().references(() => chatGroups.id, { onDelete: 'cascade' }),
    visibility: text('visibility').default('private').notNull(),
    userViewCount: integer('user_view_count').default(0).notNull(),
    ...timestamps,  // ← 展开为 accessedAt, createdAt, updatedAt
  },
  (t) => [...]
);
```

### 4. 错误触发机制

1. Drizzle ORM 根据 schema 定义生成 INSERT SQL
2. SQL 包含 `accessed_at` 字段（因为 schema 定义了它）
3. 但数据库表没有这个字段
4. PostgreSQL 返回错误：`column "accessed_at" of relation "chat_group_shares" does not exist`

## 修复步骤

### 步骤 1: 手动添加字段到数据库

连接到数据库并执行以下 SQL：

```sql
ALTER TABLE "chat_group_shares" 
ADD COLUMN "accessed_at" timestamp with time zone DEFAULT now() NOT NULL;
```

### 步骤 2: 修复迁移文件

更新 `packages/database/migrations/0115_add_chat_group_shares.sql`，添加 `accessed_at` 字段：

```sql
CREATE TABLE IF NOT EXISTS "chat_group_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_group_id" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"user_view_count" integer DEFAULT 0 NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
```

### 步骤 3: 验证修复

1. 检查数据库表结构：
   ```sql
   \d chat_group_shares
   ```

2. 测试"发布到发现页"功能：
   - 打开群组页面
   - 点击"发布到发现页"按钮
   - 确认错误消失

## 预防措施

1. **迁移文件审查**：创建新的迁移文件时，确保包含所有必要字段（包括 `...timestamps` 展开的所有字段）
2. **数据库 Schema 同步检查**：定期运行 `drizzle-kit check` 或类似工具，确保数据库与 schema 定义一致
3. **自动化测试**：添加数据库迁移测试，验证所有表结构正确

## 影响范围

- **修复前**：群组"发布到发现页"功能完全不可用
- **修复后**：功能恢复正常，与 Agent 的相同功能行为一致

## 相关文件

- `packages/database/migrations/0115_add_chat_group_shares.sql` - 修复后的迁移文件
- `packages/database/src/schemas/chatGroupShare.ts` - Schema 定义（无需修改）
- `packages/database/src/schemas/_helpers.ts` - `timestamps` 定义（无需修改）

## 作者

- 修复人：[Your Name]
- 修复日期：2026-07-02
- 审核人：[Pending]
