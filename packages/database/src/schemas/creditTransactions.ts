import { index, integer, jsonb, numeric, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';

// ──────────────────────────────────────────────
// Credit Transactions — credit top-up / consumption / refund records
// ──────────────────────────────────────────────
export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workspaceId: text('workspace_id').references(() => workspaces.id, {
      onDelete: 'set null',
    }),
    type: varchar('type', { length: 20 }).notNull(), // top_up, consumption, refund, bonus, adjustment
    amount: integer('amount').notNull(), // positive = income, negative = expense
    balanceAfter: integer('balance_after').notNull(), // balance after transaction
    source: varchar('source', { length: 50 }), // payment, api_call, referral, admin_adjust
    referenceId: text('reference_id'), // related ID (order ID, session ID, etc.)
    referenceType: varchar('reference_type', { length: 50 }), // order, session, referral
    description: text('description'),
    operatorId: text('operator_id').references(() => users.id), // operator (for admin adjustment)

    ...timestamps,
  },
  (t) => [
    index('credit_transactions_user_id_idx').on(t.userId),
    index('credit_transactions_type_idx').on(t.type),
    index('credit_transactions_created_at_idx').on(t.createdAt),
  ],
);

// Circular deps — resolve at bottom
import { users } from './user';
import { workspaces } from './workspace';

export type CreditTransactionItem = typeof creditTransactions.$inferSelect;
export type NewCreditTransactionItem = typeof creditTransactions.$inferInsert;
export type UpdateCreditTransactionItem = Partial<Omit<NewCreditTransactionItem, 'id'>>;
