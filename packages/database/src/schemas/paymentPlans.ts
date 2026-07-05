import { boolean, integer, jsonb, numeric, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { createNanoId } from '../utils/idGenerator';
import { timestamps } from './_helpers';

// ──────────────────────────────────────────────
// Payment Configs — single-row global config
// ──────────────────────────────────────────────
export const paymentConfigs = pgTable('payment_configs', {
  id: text('id')
    .$defaultFn(() => 'global')
    .notNull()
    .primaryKey(),
  wechat: jsonb('wechat').$type<{
    enabled: boolean;
    appId?: string;
    mchId?: string;
    apiKey?: string;
    apiCert?: string;
  }>().default({ enabled: false }),
  alipay: jsonb('alipay').$type<{
    enabled: boolean;
    appId?: string;
    privateKey?: string;
    publicKey?: string;
    gateway?: 'production' | 'sandbox';
  }>().default({ enabled: false }),
  currency: varchar('currency', { length: 3 }).default('CNY'),
  paymentTimeout: integer('payment_timeout').default(30),
  notifyUrl: varchar('notify_url', { length: 512 }),

  ...timestamps,
});

export type PaymentConfigItem = typeof paymentConfigs.$inferSelect;
export type NewPaymentConfigItem = typeof paymentConfigs.$inferInsert;

// ──────────────────────────────────────────────
// Plans — multi-row subscription plan definitions
// ──────────────────────────────────────────────
export const plans = pgTable('plans', {
  id: text('id')
    .$defaultFn(() => createNanoId(16)())
    .notNull()
    .primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  price: numeric('price', { mode: 'number', precision: 10, scale: 2 }).notNull(),
  monthlyCredits: integer('monthly_credits').notNull().default(0),
  personalBudget: numeric('personal_budget', { mode: 'number', precision: 15, scale: 2 }).default(0),
  workspaceBudget: numeric('workspace_budget', { mode: 'number', precision: 15, scale: 2 }).default(0),
  billingCycle: varchar('billing_cycle', { length: 16 }).notNull().default('monthly'),
  features: jsonb('features').$type<string[]>().default([]),
  enabled: boolean('enabled').default(true),
  sort: integer('sort').default(0),

  ...timestamps,
});

export type PlanItem = typeof plans.$inferSelect;
export type NewPlanItem = typeof plans.$inferInsert;
export type UpdatePlanItem = Partial<Omit<NewPlanItem, 'id'>>;

// ──────────────────────────────────────────────
// Credit Configs — single-row global credit rules
// ──────────────────────────────────────────────
export const creditConfigs = pgTable('credit_configs', {
  id: text('id')
    .$defaultFn(() => 'global')
    .notNull()
    .primaryKey(),
  pricePerCredit: numeric('price_per_credit', { mode: 'number', precision: 10, scale: 4 }).default(0.01),
  minTopUpAmount: numeric('min_top_up_amount', { mode: 'number', precision: 10, scale: 2 }).default(1),
  maxTopUpAmount: numeric('max_top_up_amount', { mode: 'number', precision: 10, scale: 2 }).default(9999),
  bonusRate: numeric('bonus_rate', { mode: 'number', precision: 5, scale: 2 }).default(0),
  creditExpiryDays: integer('credit_expiry_days').default(365),
  referralRewardCredits: integer('referral_reward_credits').default(0),

  ...timestamps,
});

export type CreditConfigItem = typeof creditConfigs.$inferSelect;
export type NewCreditConfigItem = typeof creditConfigs.$inferInsert;
