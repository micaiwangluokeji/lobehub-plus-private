import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';

export const inviteCodes = pgTable(
  'invite_codes',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull(),
    code: varchar('code', { length: 16 }).notNull().unique(),
    status: varchar('status', { length: 16 }).notNull().default('active'), // active, used
    usedByUserId: text('used_by_user_id'),
    usedAt: timestamp('used_at', { withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    index('invite_codes_user_id_idx').on(t.userId),
    index('invite_codes_code_idx').on(t.code),
  ],
);

export type InviteCodeItem = typeof inviteCodes.$inferSelect;
export type NewInviteCodeItem = typeof inviteCodes.$inferInsert;
