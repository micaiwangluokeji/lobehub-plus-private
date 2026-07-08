import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';
import { WorkspaceMemberModel } from '@/database/models/workspaceMember';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      workspaceMemberModel: new WorkspaceMemberModel(ctx.serverDB, ctx.userId),
    },
  });
});

export const workspaceMemberRouter = router({
  list: adminProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.workspaceMemberModel.listMembers(input.workspaceId);
    }),
});
