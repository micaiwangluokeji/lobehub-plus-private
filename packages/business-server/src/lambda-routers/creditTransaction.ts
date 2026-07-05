import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      creditTransactionsModel: new CreditTransactionsModel(ctx.serverDB),
    },
  });
});

// ── Validation schemas ────────────────────────────

const createCreditTransactionSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().optional(),
  type: z.enum(['top_up', 'consumption', 'refund', 'bonus', 'adjustment']),
  amount: z.number().int(),
  balanceAfter: z.number().int(),
  source: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  description: z.string().optional(),
  operatorId: z.string().optional(),
});

const listCreditTransactionsSchema = z.object({
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  createdAtAfter: z.date().optional(),
  createdAtBefore: z.date().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ── Router ────────────────────────────────────────

export const creditTransactionRouter = router({
  // ── Queries ──────────────────────────────────────

  list: adminProcedure.input(listCreditTransactionsSchema).query(async ({ input, ctx }) => {
    const { page, pageSize, ...filters } = input;
    const data = await ctx.creditTransactionsModel.list(filters);
    return {
      data,
      total: data.length,
      page,
      pageSize,
    };
  }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      return ctx.creditTransactionsModel.getById(input.id);
    }),

  getUserBalance: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.creditTransactionsModel.getUserBalance(input.userId);
    }),

  getUserStats: adminProcedure
    .input(z.object({ userId: z.string(), periodDays: z.number().int().optional() }))
    .query(async ({ input, ctx }) => {
      return ctx.creditTransactionsModel.getUserStats(input.userId, input.periodDays);
    }),

  sumAmount: adminProcedure
    .input(
      z
        .object({
          type: z.string().optional(),
          source: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      return ctx.creditTransactionsModel.sumAmount(input);
    }),

  // ── Mutations ────────────────────────────────────

  create: adminProcedure
    .input(createCreditTransactionSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.creditTransactionsModel.create(input);
    }),

  // ── Admin adjustments ────────────────────────────

  adjustCredits: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        amount: z.number().int(), // positive = add, negative = deduct
        reason: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get current balance
      const currentBalance = await ctx.creditTransactionsModel.getUserBalance(input.userId);

      // Create adjustment record
      return ctx.creditTransactionsModel.create({
        userId: input.userId,
        type: 'adjustment',
        amount: input.amount,
        balanceAfter: currentBalance + input.amount,
        description: input.reason,
        source: 'admin_adjust',
      });
    }),
});
