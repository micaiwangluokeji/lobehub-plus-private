import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { PaymentPlansModel } from '@/database/models/paymentPlans';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      paymentPlansModel: new PaymentPlansModel(ctx.serverDB),
    },
  });
});

const userProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      paymentPlansModel: new PaymentPlansModel(ctx.serverDB),
    },
  });
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(128),
  price: z.number().min(0),
  monthlyCredits: z.number().int().min(0).default(0),
  personalBudget: z.number().min(0).optional(),
  workspaceBudget: z.number().min(0).optional(),
  billingCycle: z.enum(['monthly', 'yearly', 'lifetime']).default('monthly'),
  features: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  sort: z.number().int().default(0),
});

const updatePlanSchema = createPlanSchema.partial();

const updateCreditConfigSchema = z.object({
  pricePerCredit: z.number().min(0).optional(),
  minTopUpAmount: z.number().min(0).optional(),
  maxTopUpAmount: z.number().min(0).optional(),
  bonusRate: z.number().min(0).max(100).optional(),
  creditExpiryDays: z.number().int().min(0).optional(),
  referralRewardCredits: z.number().int().min(0).optional(),
});

export const planRouter = router({
  // ── Public endpoints (user-facing) ────────────────
  listPublicPlans: userProcedure.query(async ({ ctx }) => {
    const plans = await ctx.paymentPlansModel.listPlans();
    return plans.filter((p) => p.enabled);
  }),

  getPublicCreditConfig: userProcedure.query(async ({ ctx }) => {
    return ctx.paymentPlansModel.getCreditConfig();
  }),

  // ── Plans CRUD (admin) ──
  listPlans: adminProcedure.query(async ({ ctx }) => {
    return ctx.paymentPlansModel.listPlans();
  }),

  getPlanById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.paymentPlansModel.getPlanById(input.id);
    }),

  createPlan: adminProcedure
    .input(createPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.paymentPlansModel.createPlan(input);
    }),

  updatePlan: adminProcedure
    .input(z.object({ id: z.string(), data: updatePlanSchema }))
    .mutation(async ({ input, ctx }) => {
      return ctx.paymentPlansModel.updatePlan(input.id, input.data);
    }),

  deletePlan: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.paymentPlansModel.deletePlan(input.id);
      return { success: true };
    }),

  // ── Credit Config ──
  getCreditConfig: adminProcedure.query(async ({ ctx }) => {
    return ctx.paymentPlansModel.getCreditConfig();
  }),

  updateCreditConfig: adminProcedure
    .input(updateCreditConfigSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.paymentPlansModel.updateCreditConfig(input);
    }),
});
