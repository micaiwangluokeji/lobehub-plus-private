import { index, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

export const paymentOrders = pgTable(
  'payment_orders',
  {
    id: text('id')
      .$defaultFn(() => createNanoId(24)())
      .notNull()
      .primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    planId: text('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    amount: numeric('amount', { mode: 'number', precision: 10, scale: 2 }).notNull(),
    credits: integer('credits').notNull().default(0),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, paid, expired, closed
    prepayId: varchar('prepay_id', { length: 64 }),
    transactionId: varchar('transaction_id', { length: 64 }),
    wxCodeUrl: varchar('wx_code_url', { length: 512 }),
    wxH5Url: varchar('wx_h5_url', { length: 512 }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
    refundStatus: varchar('refund_status', { length: 20 }), // null, partial, full
    refundAmount: numeric('refund_amount', { mode: 'number', precision: 10, scale: 2 }),
    description: text('description'),

    ...timestamps,
  },
  (t) => [
    index('payment_orders_user_id_idx').on(t.userId),
    index('payment_orders_status_idx').on(t.status),
    index('payment_orders_prepay_id_idx').on(t.prepayId),
  ],
);

// Circular deps
import { users } from './user';
import { plans } from './paymentPlans';

export type PaymentOrderItem = typeof paymentOrders.$inferSelect;
export type NewPaymentOrderItem = typeof paymentOrders.$inferInsert;
export type UpdatePaymentOrderItem = Partial<Omit<NewPaymentOrderItem, 'id'>>;
