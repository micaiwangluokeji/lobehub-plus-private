import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { ContentModerationLogsModel } from '@/database/models/contentModerationLogs';

const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  // TODO: add super admin check
  return opts.next({
    ctx: {
      contentModerationLogsModel: new ContentModerationLogsModel(ctx.serverDB),
    },
  });
});

export const contentModerationRouter = router({
  list: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        contentType: z.string().optional(),
        moderationResult: z.string().optional(),
        status: z.string().optional(),
        createdAtAfter: z.date().optional(),
        createdAtBefore: z.date().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const data = await ctx.contentModerationLogsModel.list({
          ...input,
        });
        // TODO: implement count in model
        const total = data.length; // This is not accurate for pagination
        return { data, total, page: input.page, pageSize: input.pageSize };
      } catch (error) {
        console.error('Failed to fetch content moderation logs:', error);
        throw new Error('Failed to fetch content moderation logs');
      }
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.contentModerationLogsModel.getById(input.id);
    }),

  create: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        contentType: z.string(),
        contentId: z.string().optional(),
        moderationResult: z.string(),
        riskScore: z.string().optional(),
        flaggedTags: z.array(z.string()).optional(),
        reviewedBy: z.string().optional(),
        reviewedAt: z.date().optional(),
        status: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.contentModerationLogsModel.create(input);
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string(),
        reviewedBy: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.contentModerationLogsModel.update(input.id, {
        status: input.status,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      });
    }),

  getModerationStats: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional(),
    )
    .query(async ({ input, ctx }) => {
      return ctx.contentModerationLogsModel.getModerationStats(input);
    }),
});
