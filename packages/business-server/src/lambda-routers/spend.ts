import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { SpendLogsModel } from '@/database/models/spendLogs';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      spendLogsModel: new SpendLogsModel(ctx.serverDB),
    },
  });
});

// ── Validation schemas ────────────────────────────

const listSpendLogsSchema = z.object({
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  sessionId: z.string().optional(),
  modelId: z.string().optional(),
  providerId: z.string().optional(),
  status: z.string().optional(),
  createdAtAfter: z.date().optional(),
  createdAtBefore: z.date().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const createSpendLogSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().optional(),
  sessionId: z.string().optional(),
  modelId: z.string().optional(),
  modelName: z.string().optional(),
  providerId: z.string().optional(),
  promptTokens: z.number().int().min(0).default(0),
  completionTokens: z.number().int().min(0).default(0),
  totalTokens: z.number().int().min(0).default(0),
  inputCost: z.number().min(0).default(0),
  outputCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0),
  creditsConsumed: z.number().int().min(0).default(0),
  pricePerCredit: z.number().min(0).optional(),
  durationMs: z.number().int().optional(),
  status: z.enum(['success', 'failed', 'timeout']).default('success'),
  errorMessage: z.string().optional(),
});

// ── Router ────────────────────────────────────────

export const spendRouter = router({
  // ── Queries ──────────────────────────────────────

  list: adminProcedure.input(listSpendLogsSchema).query(async ({ input, ctx }) => {
    const { page, pageSize, ...filters } = input;
    const data = await ctx.spendLogsModel.list(filters);
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
      return ctx.spendLogsModel.getById(input.id);
    }),

  // ── Statistics ────────────────────────────────────

  sumUserCost: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.spendLogsModel.sumUserCost({
        userId: input.userId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  sumModelCost: adminProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      return ctx.spendLogsModel.sumModelCost(input);
    }),

  getDailyCostTrend: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      return ctx.spendLogsModel.getDailyCostTrend(input.days);
    }),

  getTopSpenders: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.spendLogsModel.getTopSpenders(input.limit, {
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  // ── Mutations ────────────────────────────────────

  create: adminProcedure
    .input(createSpendLogSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.spendLogsModel.create(input);
    }),
});
