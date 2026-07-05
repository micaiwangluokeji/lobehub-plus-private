import { TRPCError } from '@trpc/server';
import { eq, and, isNull, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { WorkspaceMemberModel } from '@/database/models/workspaceMember';
import { WorkspaceModel } from '@/database/models/workspace';
import { UserModel } from '@/database/models/user';
import { users } from '@/database/schemas/user';
import { workspaceMembers, workspaceInvitations } from '@/database/schemas/workspace';

const memberProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      workspaceMemberModel: new WorkspaceMemberModel(ctx.serverDB, ctx.userId),
      workspaceModel: new WorkspaceModel(ctx.serverDB, ctx.userId),
      userModel: new UserModel(ctx.serverDB, ctx.userId),
    },
  });
});

const requireWorkspaceOwner = memberProcedure.use(async ({ ctx, next, input }: any) => {
  const workspaceId = input?.workspaceId;
  if (!workspaceId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'workspaceId is required' });
  }

  const membership = await ctx.workspaceMemberModel.getMember(workspaceId, ctx.userId);
  if (!membership || membership.role !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only workspace owners can perform this action.',
    });
  }

  return next({ ctx: { ...ctx, workspaceId } });
});

export const workspaceMemberRouter = router({
  list: memberProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const membership = await ctx.workspaceMemberModel.getMember(input.workspaceId, ctx.userId);
      if (!membership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this workspace.',
        });
      }

      const members = await ctx.serverDB.query.workspaceMembers.findMany({
        where: and(
          eq(workspaceMembers.workspaceId, input.workspaceId),
          isNull(workspaceMembers.deletedAt),
        ),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: desc(workspaceMembers.joinedAt),
      });

      return members.map((m: any) => ({
        id: m.userId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        email: m.user?.email,
        fullName: m.user?.fullName,
        avatar: m.user?.avatar,
      }));
    }),

  updateRole: requireWorkspaceOwner
    .input(
      z.object({
        workspaceId: z.string(),
        userId: z.string(),
        role: z.enum(['owner', 'member', 'viewer']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot change your own role.',
        });
      }

      await ctx.workspaceMemberModel.updateMemberRole(
        input.workspaceId,
        input.userId,
        input.role,
      );
      return { success: true };
    }),

  remove: requireWorkspaceOwner
    .input(z.object({ workspaceId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot remove yourself from the workspace.',
        });
      }

      await ctx.workspaceMemberModel.removeMember(input.workspaceId, input.userId);
      return { success: true };
    }),

  invite: requireWorkspaceOwner
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string().email(),
        role: z.enum(['owner', 'member', 'viewer']).default('member'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = await ctx.serverDB.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        const existingMembership = await ctx.workspaceMemberModel.getMember(
          input.workspaceId,
          existingUser.id,
        );
        if (existingMembership) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this workspace.',
          });
        }

        await ctx.workspaceMemberModel.addMember({
          userId: existingUser.id,
          workspaceId: input.workspaceId,
          role: input.role,
        });

        return { success: true, type: 'direct_add' };
      }

      const invitation = await ctx.workspaceMemberModel.createInvitation({
        email: input.email,
        workspaceId: input.workspaceId,
        role: input.role,
      });

      return { success: true, type: 'invitation', invitation };
    }),

  listInvitations: requireWorkspaceOwner
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.workspaceMemberModel.listPendingInvitations(input.workspaceId);
    }),

  revokeInvitation: requireWorkspaceOwner
    .input(z.object({ workspaceId: z.string(), invitationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.workspaceMemberModel.revokeInvitation(input.invitationId);
      return { success: true };
    }),

  getMyMembership: memberProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.workspaceMemberModel.getMember(input.workspaceId, ctx.userId);
    }),
});
