import { index, integer, numeric, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';

// ──────────────────────────────────────────────
// Spend Logs — AI API call spend records
// ──────────────────────────────────────────────
export const spendLogs = pgTable(
  'spend_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workspaceId: text('workspace_id').references(() => workspaces.id, {
      onDelete: 'set null',
    }),
    sessionId: text('session_id').references(() => sessions.id, {
      onDelete: 'set null',
    }),
    modelId: varchar('model_id', { length: 150 }), // no FK constraint - aiModels.id is not unique
    modelName: varchar('model_name', { length: 100 }), // redundant, for easy query
    providerId: varchar('provider_id', { length: 64 }), // no FK constraint - aiProviders.id is not unique
    promptTokens: integer('prompt_tokens').notNull().default(0),
    completionTokens: integer('completion_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    inputCost: numeric('input_cost', { mode: 'number', precision: 12, scale: 2 })
      .notNull()
      .default(0), // input cost (CNY)
    outputCost: numeric('output_cost', { mode: 'number', precision: 12, scale: 2 })
      .notNull()
      .default(0), // output cost (CNY)
    totalCost: numeric('total_cost', { mode: 'number', precision: 12, scale: 2 })
      .notNull()
      .default(0), // total cost (CNY)
    creditsConsumed: integer('credits_consumed').notNull().default(0), // credits consumed
    pricePerCredit: numeric('price_per_credit', { mode: 'number', precision: 12, scale: 4 }), // exchange rate at time of spend
    durationMs: integer('duration_ms'), // response time (ms)
    status: varchar('status', { length: 20 }).notNull().default('success'), // success, failed, timeout
    errorMessage: text('error_message'),

    ...timestamps,
  },
  (t) => [
    index('spend_logs_user_id_idx').on(t.userId),
    index('spend_logs_workspace_id_idx').on(t.workspaceId),
    index('spend_logs_created_at_idx').on(t.createdAt),
    index('spend_logs_model_id_idx').on(t.modelId),
  ],
);

// Circular deps — resolve at bottom
import { users } from './user';
import { workspaces } from './workspace';
import { sessions } from './session';
import { aiModels } from './aiInfra';
import { aiProviders } from './aiInfra';

export type SpendLogItem = typeof spendLogs.$inferSelect;
export type NewSpendLogItem = typeof spendLogs.$inferInsert;
export type UpdateSpendLogItem = Partial<Omit<NewSpendLogItem, 'id'>>;
