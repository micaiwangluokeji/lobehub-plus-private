import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const contentModerationLogs = pgTable('content_moderation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // 移除外键约束
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'message', 'file', 'knowledge_base'
  contentId: uuid('content_id'),
  moderationResult: varchar('moderation_result', { length: 20 }).notNull(), // 'safe', 'flagged', 'blocked'
  riskScore: text('risk_score'), // 0-100
  flaggedTags: text('flagged_tags').array(),
  reviewedBy: uuid('reviewed_by'), // 移除外键约束
  reviewedAt: timestamp('reviewed_at'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'approved', 'rejected'
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
});

export const selectContentModerationLogSchema = createSelectSchema(contentModerationLogs);
export const insertContentModerationLogSchema = createInsertSchema(contentModerationLogs);

export type ContentModerationLogItem = typeof contentModerationLogs.$inferSelect;
export type NewContentModerationLogItem = typeof contentModerationLogs.$inferInsert;
export type UpdateContentModerationLogItem = Partial<Omit<NewContentModerationLogItem, 'id'>>;
