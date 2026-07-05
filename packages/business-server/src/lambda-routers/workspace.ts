import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { WorkspaceModel } from '@/database/models/workspace';
import { seedWorkspaceRoles } from '@/database/utils/seedWorkspaceRoles';
import { WORKSPACE_SYSTEM_ROLES } from '@/const/rbac';
import { assignWorkspaceRoleToUser } from '@/database/utils/seedWorkspaceRoles';

const workspaceProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      workspaceModel: new WorkspaceModel(ctx.serverDB, ctx.userId),
    },
  });
});

export const workspaceRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.workspaceModel.listUserWorkspaces();
  }),

  create: workspaceProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
        description: z.string().max(1000).optional(),
        avatar: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.workspaceModel.findBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Workspace slug already exists.',
        });
      }

      const workspace = await ctx.workspaceModel.create(input);

      await seedWorkspaceRoles(ctx.serverDB, workspace.id);

      await assignWorkspaceRoleToUser(ctx.serverDB, {
        roleName: WORKSPACE_SYSTEM_ROLES.OWNER,
        userId: ctx.userId,
        workspaceId: workspace.id,
      });

      return workspace;
    }),

  getById: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspace = await ctx.workspaceModel.findById(input.id);
      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
      }
      return workspace;
    }),

  getBySlug: workspaceProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const workspace = await ctx.workspaceModel.findBySlug(input.slug);
      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
      }
      return workspace;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().max(1000).optional(),
        avatar: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      if (data.slug) {
        const existing = await ctx.workspaceModel.findBySlug(data.slug);
        if (existing && existing.id !== id) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Workspace slug already exists.',
          });
        }
      }

      await ctx.workspaceModel.update(id, data);
      return { success: true };
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.workspaceModel.delete(input.id);
      return { success: true };
    }),

  countUserWorkspaces: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.workspaceModel.countUserMemberships();
  }),

  ensureMarketOrganization: authedProcedure.mutation(
    async (): Promise<{ marketAccountId: number }> => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Workspace market organization is a cloud-only feature.',
      });
    },
  ),
});
