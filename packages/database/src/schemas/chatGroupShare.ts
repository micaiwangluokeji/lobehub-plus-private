import { index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';
import { chatGroups } from './chatGroup';

export const chatGroupShares = pgTable(
  'chat_group_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    chatGroupId: text('chat_group_id')
      .notNull()
      .references(() => chatGroups.id, { onDelete: 'cascade' }),

    // 'private' (default, owner-only) | 'link' (anyone with the share link)
    // | 'official' (published to the marketplace by an admin, visible to all users)
    // | 'pending_review' (VIP-submitted, awaiting super_admin approval)
    visibility: text('visibility').default('private').notNull(),

    /** Unique visitor count — incremented by the application layer on each new visitor session. */
    userViewCount: integer('user_view_count').default(0).notNull(),

    ...timestamps,
  },
  (t) => [
    uniqueIndex('chat_group_shares_chat_group_id_unique').on(t.chatGroupId),
    index('chat_group_shares_visibility_idx').on(t.visibility),
  ],
);

export type NewChatGroupShare = typeof chatGroupShares.$inferInsert;
export type ChatGroupShareItem = typeof chatGroupShares.$inferSelect;
