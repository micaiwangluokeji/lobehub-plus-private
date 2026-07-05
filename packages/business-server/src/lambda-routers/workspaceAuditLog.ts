import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { WorkspaceAuditLogModel } from '@/database/models/workspaceAuditLog';

const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      auditLogModel: new WorkspaceAuditLogModel(ctx.serverDB),
    },
  });
});

export const workspaceAuditLogRouter = router({
  adminList: adminProcedure
    .input(
      z.object({
        action: z.string().optional(),
        keyword: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        resourceType: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const items = await ctx.auditLogModel.adminList(input);
      const total = await ctx.auditLogModel.adminCount(input);
      return { data: items, total };
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.auditLogModel.getById(input.id);
    }),
});
