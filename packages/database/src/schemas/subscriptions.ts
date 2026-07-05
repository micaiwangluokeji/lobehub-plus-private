import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

// ──────────────────────────────────────────────
// Subscriptions — user subscription records
// ──────────────────────────────────────────────
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id')
      .$defaultFn(() => createNanoId(16)())
      .notNull()
      .primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    workspaceId: text('workspace_id').references(() => workspaces.id, {
      onDelete: 'set null',
    }),
    planId: text('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 20 }).notNull().default('active'), // active, canceled, expired, past_due
    billingCycle: varchar('billing_cycle', { length: 20 }).notNull().default('month'), // month, year
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
    paymentProvider: varchar('payment_provider', { length: 50 }), // wechat, alipay, stripe
    paymentSubscriptionId: text('payment_subscription_id'), // third-party subscription ID

    ...timestamps,
  },
  (t) => [
    index('subscriptions_user_id_idx').on(t.userId),
    index('subscriptions_status_idx').on(t.status),
    index('subscriptions_current_period_end_idx').on(t.currentPeriodEnd),
  ],
);

// Circular deps — resolve at bottom
import { users } from './user';
import { workspaces } from './workspace';
import { plans } from './paymentPlans';

export type SubscriptionItem = typeof subscriptions.$inferSelect;
export type NewSubscriptionItem = typeof subscriptions.$inferInsert;
export type UpdateSubscriptionItem = Partial<Omit<NewSubscriptionItem, 'id'>>;
