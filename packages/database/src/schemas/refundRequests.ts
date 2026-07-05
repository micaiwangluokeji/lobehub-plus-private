import { index, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

export const refundRequests = pgTable(
  'refund_requests',
  {
    id: text('id')
      .$defaultFn(() => createNanoId(24)())
      .notNull()
      .primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    orderId: text('order_id')
      .references(() => paymentOrders.id, { onDelete: 'cascade' })
      .notNull(),
    amount: numeric('amount', { mode: 'number', precision: 10, scale: 2 }).notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected, processing, completed, failed
    reviewerId: text('reviewer_id').references(() => users.id),
    reviewNote: text('review_note'),
    wxRefundId: varchar('wx_refund_id', { length: 64 }),
    processedAt: timestamp('processed_at', { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    index('refund_requests_user_id_idx').on(t.userId),
    index('refund_requests_order_id_idx').on(t.orderId),
    index('refund_requests_status_idx').on(t.status),
  ],
);

// Circular deps
import { users } from './user';
import { paymentOrders } from './paymentOrders';

export type RefundRequestItem = typeof refundRequests.$inferSelect;
export type NewRefundRequestItem = typeof refundRequests.$inferInsert;
