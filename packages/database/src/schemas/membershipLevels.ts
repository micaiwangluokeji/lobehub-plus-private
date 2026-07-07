import { boolean, integer, jsonb, numeric, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

export const membershipLevels = pgTable('membership_levels', {
  id: text('id')
    .$defaultFn(() => createNanoId(16)())
    .notNull()
    .primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  level: integer('level').notNull().default(0),
  minRechargeTotal: numeric('min_recharge_total', { mode: 'number', precision: 12, scale: 2 }).notNull().default(0),
  monthlyCreditsBonus: integer('monthly_credits_bonus').default(0),
  storageBonusMB: integer('storage_bonus_mb').default(0),
  features: jsonb('features').$type<string[]>().default([]),
  icon: varchar('icon', { length: 64 }),
  color: varchar('color', { length: 16 }),
  enabled: boolean('enabled').default(true),
  sort: integer('sort').default(0),
  defaultRole: varchar('default_role', { length: 32 }).default('free_user'),

  ...timestamps,
});

export type MembershipLevelItem = typeof membershipLevels.$inferSelect;
export type NewMembershipLevelItem = typeof membershipLevels.$inferInsert;
export type UpdateMembershipLevelItem = Partial<Omit<NewMembershipLevelItem, 'id'>>;
