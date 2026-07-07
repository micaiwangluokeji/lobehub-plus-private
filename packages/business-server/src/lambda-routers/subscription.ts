import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { SubscriptionsModel } from '@/database/models/subscriptions';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      subscriptionsModel: new SubscriptionsModel(ctx.serverDB),
    },
  });
});

// ── Validation schemas ────────────────────────────

const createSubscriptionSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().optional(),
  planId: z.string().min(1),
  status: z.enum(['active', 'canceled', 'expired', 'past_due']).default('active'),
  billingCycle: z.enum(['month', 'year']).default('month'),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  paymentProvider: z.string().optional(),
  paymentSubscriptionId: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'canceled', 'expired', 'past_due']).optional(),
  billingCycle: z.enum(['month', 'year']).optional(),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  canceledAt: z.date().optional(),
  cancelReason: z.string().optional(),
  paymentProvider: z.string().optional(),
  paymentSubscriptionId: z.string().optional(),
});

const listSubscriptionsSchema = z.object({
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  status: z.string().optional(),
  planId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ── Router ────────────────────────────────────────

export const subscriptionRouter = router({
  // ── Queries ──────────────────────────────────────

  list: adminProcedure.input(listSubscriptionsSchema).query(async ({ input, ctx }) => {
    const { page, pageSize, ...filters } = input;
    const data = await ctx.subscriptionsModel.list(filters);
    return {
      data,
      total: data.length,
      page,
      pageSize,
    };
  }),

  getById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return ctx.subscriptionsModel.getById(input.id);
  }),

  getActiveSubscription: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.getActiveSubscription(input.userId);
    }),

  getExpiringSubscriptions: adminProcedure
    .input(z.object({ daysBefore: z.number().int().min(1).default(7) }))
    .query(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.getExpiringSubscriptions(input.daysBefore);
    }),

  countSubscriptions: adminProcedure
    .input(z.object({ status: z.string().optional(), planId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.countSubscriptions(input);
    }),

  // ── Mutations ────────────────────────────────────

  create: adminProcedure
    .input(createSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.create(input);
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateSubscriptionSchema }))
    .mutation(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.update(input.id, input.data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.subscriptionsModel.delete(input.id);
      return { success: true };
    }),

  cancelSubscription: adminProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.cancelSubscription(input.id, input.reason);
    }),

  renewSubscription: adminProcedure
    .input(z.object({ id: z.string(), newPeriodEnd: z.date() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.subscriptionsModel.renewSubscription(input.id, input.newPeriodEnd);
    }),
});
