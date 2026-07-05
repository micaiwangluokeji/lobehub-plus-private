import { pgTable, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const systemHealthChecks = pgTable('system_health_checks', {
  id: varchar('id', { length: 64 }).primaryKey(), // e.g., 'api-lobehub-com-20240101-120000'
  serviceName: varchar('service_name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'healthy', 'degraded', 'down'
  responseTime: integer('response_time'), // ms
  errorMessage: text('error_message'),
  checkedAt: timestamp('checked_at').default(sql`now()`).notNull(),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
});

export const selectSystemHealthCheckSchema = createSelectSchema(systemHealthChecks);
export const insertSystemHealthCheckSchema = createInsertSchema(systemHealthChecks);

export type SystemHealthCheckItem = typeof systemHealthChecks.$inferSelect;
export type NewSystemHealthCheckItem = typeof systemHealthChecks.$inferInsert;
export type UpdateSystemHealthCheckItem = Partial<Omit<NewSystemHealthCheckItem, 'id'>>;
