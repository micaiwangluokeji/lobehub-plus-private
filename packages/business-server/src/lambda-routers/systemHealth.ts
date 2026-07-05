import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { SystemHealthChecksModel } from '@/database/models/systemHealthChecks';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      systemHealthChecksModel: new SystemHealthChecksModel(ctx.serverDB),
    },
  });
});

export const systemHealthRouter = router({
  list: adminProcedure
    .input(
      z.object({
        serviceName: z.string().optional(),
        status: z.string().optional(),
        checkedAtAfter: z.date().optional(),
        checkedAtBefore: z.date().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const data = await ctx.systemHealthChecksModel.list({
          ...input,
        });
        // TODO: implement count in model
        const total = data.length; // This is not accurate for pagination
        return { data, total, page: input.page, pageSize: input.pageSize };
      } catch (error) {
        console.error('Failed to fetch system health checks:', error);
        throw new Error('Failed to fetch system health checks');
      }
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.systemHealthChecksModel.getById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        serviceName: z.string(),
        status: z.string(),
        responseTime: z.number().optional(),
        errorMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const id = `${input.serviceName}-${Date.now()}`;
      return ctx.systemHealthChecksModel.create({
        id,
        serviceName: input.serviceName,
        status: input.status,
        responseTime: input.responseTime,
        errorMessage: input.errorMessage,
        checkedAt: new Date(),
      });
    }),

  getHealthStatus: adminProcedure
    .query(async ({ ctx }) => {
      return ctx.systemHealthChecksModel.getHealthStatus();
    }),

  getServiceStats: adminProcedure
    .input(
      z.object({
        serviceName: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.systemHealthChecksModel.getServiceStats(input.serviceName, {
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
