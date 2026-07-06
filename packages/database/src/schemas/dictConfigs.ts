import { boolean, integer, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

export const dictConfigs = pgTable('dict_configs', {
  id: text('id')
    .$defaultFn(() => createNanoId(16)())
    .notNull()
    .primaryKey(),
  key: varchar('key', { length: 128 }).notNull().unique(),
  value: jsonb('value').$type<unknown>().notNull(),
  label: varchar('label', { length: 256 }).notNull(),
  group: varchar('group', { length: 64 }).notNull().default('general'),
  type: varchar('type', { length: 16 }).notNull().default('string'), // string, number, boolean, json
  sort: integer('sort').default(0),
  description: text('description'),
  enabled: boolean('enabled').default(true),

  ...timestamps,
});

export type DictConfigItem = typeof dictConfigs.$inferSelect;
export type NewDictConfigItem = typeof dictConfigs.$inferInsert;
export type UpdateDictConfigItem = Partial<Omit<NewDictConfigItem, 'id'>>;
