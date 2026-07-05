import { InsertChatGroupSchema } from '@lobechat/types';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { withScopedPermission } from '@/business/server/trpc-middlewares/rbacPermission';
import { wsCompatProcedure } from '@/business/server/trpc-middlewares/workspaceAuth';
import { AgentModel } from '@/database/models/agent';
import { ChatGroupModel } from '@/database/models/chatGroup';
import { ChatGroupShareModel } from '@/database/models/chatGroupShare';
import { RbacModel } from '@/database/models/rbac';
import { UserModel } from '@/database/models/user';
import { AgentGroupRepository } from '@/database/repositories/agentGroup';
import { workspaceMembers } from '@/database/schemas';
import { type ChatGroupConfig } from '@/database/types/chatGroup';
import { router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { AgentGroupService } from '@/server/services/agentGroup';
import { EditLockService } from '@/server/services/editLock';
import { publishResourceEvent } from '@/server/services/resourceEvents';
import { TransferErrorCode } from '@/types/transferError';

/**
 * Custom schema for agent member input, replacing drizzle-generated insertAgentSchema
 * to avoid Json type inference issues with jsonb columns.
 */
const agentMemberInputSchema = z
  .object({
    agencyConfig: z.any().nullish(),
    avatar: z.string().nullish(),
    backgroundColor: z.string().nullish(),
    clientId: z.string().nullish(),
    description: z.string().nullish(),
    editorData: z.any().nullish(),
    fewShots: z.any().nullish(),
    id: z.string().optional(),
    marketIdentifier: z.string().nullish(),
    model: z.string().nullish(),
    params: z.any().nullish(),
    pinned: z.boolean().nullish(),
    plugins: z.array(z.string()).nullish(),
    provider: z.string().nullish(),
    sessionGroupId: z.string().nullish(),
    slug: z.string().nullish(),
    systemRole: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    title: z.string().nullish(),
    virtual: z.boolean().nullish(),
  })
  .partial();

const agentGroupProcedure = wsCompatProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  const wsId = ctx.workspaceId ?? undefined;

  return opts.next({
    ctx: {
      agentGroupRepo: new AgentGroupRepository(ctx.serverDB, ctx.userId, wsId),
      agentGroupService: new AgentGroupService(ctx.serverDB, ctx.userId, wsId),
      agentModel: new AgentModel(ctx.serverDB, ctx.userId, wsId),
      chatGroupModel: new ChatGroupModel(ctx.serverDB, ctx.userId, wsId),
      chatGroupShareModel: new ChatGroupShareModel(ctx.serverDB, ctx.userId, wsId),
      editLockService: new EditLockService(ctx.userId),
      userModel: new UserModel(ctx.serverDB, ctx.userId),
    },
  });
});

// Write variant gates viewers out of chat-group mutations (create/update/
// delete + member adds/removes). Reads keep the bare proc.
const agentGroupProcedureWrite = agentGroupProcedure.use(withScopedPermission('agent:update'));

export const agentGroupRouter = router({
  addAgentsToGroup: agentGroupProcedureWrite
    .input(
      z.object({
        agentIds: z.array(z.string()),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.chatGroupModel.addAgentsToGroup(input.groupId, input.agentIds);
    }),

  /**
   * Batch create virtual agents and add them to an existing group.
   * This is more efficient than calling createAgentOnly multiple times.
   */
  batchCreateAgentsInGroup: agentGroupProcedureWrite
    .input(
      z.object({
        agents: z.array(agentMemberInputSchema),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Batch create virtual agents
      const agentConfigs = input.agents.map((agent) => ({
        ...agent,
        plugins: agent.plugins as string[] | undefined,
        tags: agent.tags as string[] | undefined,
        virtual: true,
      }));

      const createdAgents = await ctx.agentModel.batchCreate(agentConfigs);
      const agentIds = createdAgents.map((agent) => agent.id);

      // Add all agents to the group
      await ctx.chatGroupModel.addAgentsToGroup(input.groupId, agentIds);

      return { agentIds, agents: createdAgents };
    }),

  /**
   * Check agents before removal to identify virtual agents that will be permanently deleted.
   * This allows the frontend to show a confirmation dialog.
   */
  checkAgentsBeforeRemoval: agentGroupProcedure
    .input(
      z.object({
        agentIds: z.array(z.string()),
        groupId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.agentGroupRepo.checkAgentsBeforeRemoval(input.groupId, input.agentIds);
    }),

  /**
   * Create a group with a supervisor agent.
   * The supervisor agent is automatically created as a virtual agent.
   * Returns the groupId and supervisorAgentId.
   */
  createGroup: agentGroupProcedureWrite
    .input(InsertChatGroupSchema)
    .mutation(async ({ input, ctx }) => {
      const { group, supervisorAgentId } = await ctx.agentGroupRepo.createGroupWithSupervisor({
        ...input,
        config: ctx.agentGroupService.normalizeGroupConfig(input.config as ChatGroupConfig | null),
      });

      return { group, supervisorAgentId };
    }),

  /**
   * Create a group with virtual member agents in one request.
   * This is the recommended way to create a group from a template.
   * The backend will:
   * 1. Create a supervisor agent (virtual)
   * 2. Batch create virtual agents from member configs
   * 3. Create the group with supervisor and member agents
   * Returns the groupId, supervisorAgentId, and created member agentIds.
   */
  createGroupWithMembers: agentGroupProcedureWrite
    .input(
      z.object({
        groupConfig: InsertChatGroupSchema,
        members: z.array(agentMemberInputSchema),
        supervisorConfig: z
          .object({
            avatar: z.string().nullish(),
            backgroundColor: z.string().nullish(),
            chatConfig: z.any().nullish(),
            description: z.string().nullish(),
            model: z.string().nullish(),
            params: z.any().nullish(),
            plugins: z.array(z.string()).nullish(),
            provider: z.string().nullish(),
            systemRole: z.string().nullish(),
            tags: z.array(z.string()).nullish(),
            title: z.string().nullish(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Batch create virtual member agents
      const memberConfigs = input.members.map((member) => ({
        ...member,
        plugins: member.plugins as string[] | undefined,
        tags: member.tags as string[] | undefined,
        virtual: true,
      }));

      const createdAgents = await ctx.agentModel.batchCreate(memberConfigs);
      const memberAgentIds = createdAgents.map((agent) => agent.id);

      // 2. Create group with supervisor and member agents
      // Filter out null/undefined values from supervisorConfig
      const supervisorConfig = input.supervisorConfig
        ? Object.fromEntries(Object.entries(input.supervisorConfig).filter(([_, v]) => v != null))
        : undefined;

      const normalizedConfig = ctx.agentGroupService.normalizeGroupConfig(
        input.groupConfig.config as ChatGroupConfig | null,
      );

      const { group, supervisorAgentId } = await ctx.agentGroupRepo.createGroupWithSupervisor(
        {
          ...input.groupConfig,
          config: normalizedConfig,
        },
        memberAgentIds,
        supervisorConfig as any,
      );

      return { agentIds: memberAgentIds, groupId: group.id, supervisorAgentId };
    }),

  deleteGroup: agentGroupProcedureWrite
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.agentGroupService.deleteGroup(input.id);
    }),

  /**
   * Duplicate a chat group with all its members.
   * Creates a new group with the same config, a new supervisor, and copies of virtual members.
   * Non-virtual members are referenced (not copied).
   */
  duplicateGroup: agentGroupProcedureWrite
    .input(
      z.object({
        groupId: z.string(),
        newTitle: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentGroupRepo.duplicate(input.groupId, input.newTitle);
    }),

  getGroup: agentGroupProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.chatGroupModel.findById(input.id);
    }),

  getGroupAgents: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.chatGroupModel.getGroupAgents(input.groupId);
    }),

  /**
   * Get a group by forkedFromIdentifier stored in config
   * @returns group id if exists, null otherwise
   */
  getGroupByForkedFromIdentifier: agentGroupProcedure
    .input(
      z.object({
        forkedFromIdentifier: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.chatGroupModel.getGroupByForkedFromIdentifier(input.forkedFromIdentifier);
    }),

  getGroupDetail: agentGroupProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [defaultAgentConfig, detail] = await Promise.all([
        ctx.userModel.getUserSettingsDefaultAgentConfig(),
        ctx.agentGroupService.getGroupDetail(input.id),
      ]);

      if (!detail) return null;

      return {
        ...detail,
        agents: ctx.agentGroupService.mergeAgentsDefaultConfig(defaultAgentConfig, detail.agents),
      };
    }),

  getGroups: agentGroupProcedure.query(async ({ ctx }) => {
    const [defaultAgentConfig, groups] = await Promise.all([
      ctx.userModel.getUserSettingsDefaultAgentConfig(),
      ctx.agentGroupService.getGroups(),
    ]);

    return groups.map((group) => ({
      ...group,
      agents: ctx.agentGroupService.mergeAgentsDefaultConfig(defaultAgentConfig, group.agents),
    }));
  }),

  /**
   * Remove agents from a group.
   * - Non-virtual agents are simply removed from the group (agent still exists)
   * - Virtual agents are permanently deleted along with removal from group
   *
   * @param groupId - The group to remove agents from
   * @param agentIds - Array of agent IDs to remove
   * @param deleteVirtualAgents - Whether to delete virtual agents (default: true)
   */
  removeAgentsFromGroup: agentGroupProcedureWrite
    .input(
      z.object({
        agentIds: z.array(z.string()),
        deleteVirtualAgents: z.boolean().optional(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.agentGroupRepo.removeAgentsFromGroup(
        input.groupId,
        input.agentIds,
        input.deleteVirtualAgents,
      );
    }),

  transferGroup: agentGroupProcedureWrite
    .input(
      z.object({
        groupId: z.string(),
        targetWorkspaceId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.chatGroupModel.findById(input.groupId);
      if (!group) {
        throw new TRPCError({
          cause: { data: { code: TransferErrorCode.ResourceNotFound } },
          code: 'NOT_FOUND',
          message: 'Agent group not found',
        });
      }

      if (ctx.workspaceId && group.userId !== ctx.userId) {
        const [membership] = await ctx.serverDB
          .select({ role: workspaceMembers.role })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, ctx.workspaceId),
              eq(workspaceMembers.userId, ctx.userId),
              isNull(workspaceMembers.deletedAt),
            ),
          )
          .limit(1);

        if (!membership || membership.role !== 'owner') {
          throw new TRPCError({
            cause: { data: { code: TransferErrorCode.OwnerOnly } },
            code: 'FORBIDDEN',
            message: 'Only workspace owners can transfer agent groups created by others',
          });
        }
      }

      if (input.targetWorkspaceId) {
        const [targetMembership] = await ctx.serverDB
          .select({ role: workspaceMembers.role })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, input.targetWorkspaceId),
              eq(workspaceMembers.userId, ctx.userId),
              isNull(workspaceMembers.deletedAt),
            ),
          )
          .limit(1);

        if (!targetMembership || targetMembership.role === 'viewer') {
          throw new TRPCError({
            cause: { data: { code: TransferErrorCode.TargetNoWriteAccess } },
            code: 'FORBIDDEN',
            message: 'No write access to target workspace',
          });
        }
      }

      if (input.targetWorkspaceId === ctx.workspaceId) {
        throw new TRPCError({
          cause: { data: { code: TransferErrorCode.SameWorkspace } },
          code: 'BAD_REQUEST',
          message: 'Cannot transfer agent group to the same workspace',
        });
      }

      return ctx.agentGroupRepo.transferToWorkspace(
        input.groupId,
        input.targetWorkspaceId,
        ctx.userId,
      );
    }),

  updateAgentInGroup: agentGroupProcedureWrite
    .input(
      z.object({
        agentId: z.string(),
        groupId: z.string(),
        updates: z.object({
          enabled: z.boolean().optional(),
          order: z.number().optional(),
          role: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.chatGroupModel.updateAgentInGroup(input.groupId, input.agentId, input.updates);
    }),

  updateGroup: agentGroupProcedureWrite
    .input(
      z.object({
        id: z.string(),
        value: InsertChatGroupSchema.partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Collaborative edit lock: reject writes to a workspace group another
      // member is actively editing. Inert until a client acquires the lock.
      if (ctx.workspaceId) {
        const blockedBy = await ctx.editLockService.getBlockingHolder('chatGroup', input.id);
        if (blockedBy) {
          throw new TRPCError({
            cause: { data: { code: 'DocumentLocked' } },
            code: 'CONFLICT',
            message: 'Group is being edited by another user',
          });
        }
      }

      return ctx.chatGroupModel.update(input.id, {
        ...input.value,
        config: ctx.agentGroupService.normalizeGroupConfig(
          input.value.config as ChatGroupConfig | null,
        ),
      });
    }),

  acquireGroupLock: agentGroupProcedureWrite
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspaceId) return { expiresAt: null, holderId: null, lockedByOther: false };
      const prev = await ctx.editLockService.getActiveHolder('chatGroup', input.id);
      const result = await ctx.editLockService.acquire('chatGroup', input.id);
      if ((result.holderId ?? null) !== (prev ?? null)) {
        void publishResourceEvent(
          { id: input.id, type: 'chatGroup' },
          { actorId: ctx.userId, data: { holderId: result.holderId }, type: 'lock.changed' },
        );
      }
      return result;
    }),

  getGroupLock: agentGroupProcedureWrite
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspaceId) return { expiresAt: null, holderId: null, lockedByOther: false };
      const holder = await ctx.editLockService.getActiveHolder('chatGroup', input.id);
      return {
        expiresAt: null,
        holderId: holder ?? null,
        lockedByOther: Boolean(holder) && holder !== ctx.userId,
      };
    }),

  releaseGroupLock: agentGroupProcedureWrite
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspaceId) return;
      // Only broadcast "unlocked" when we actually released our own lock — if the
      // lease expired and another member took over, the lock is still held.
      const released = await ctx.editLockService.release('chatGroup', input.id);
      if (!released) return;
      void publishResourceEvent(
        { id: input.id, type: 'chatGroup' },
        { actorId: ctx.userId, data: { holderId: null }, type: 'lock.changed' },
      );
    }),

  // ==================== Official Group (Marketplace) ====================

  /**
   * Publish a group to the marketplace as an official group.
   * Two permission paths:
   * - `group:publish:all` — super_admin publishes directly to `'official'`
   *   (skips ownership gate so they can publish groups they did not create).
   * - `group:publish:owner` — VIP can only submit their own groups for review;
   *   the share record is set to `'pending_review'` and a super_admin must
   *   approve it before it becomes `'official'`.
   */
  publishAsOfficialGroup: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rbacModel = new RbacModel(ctx.serverDB, ctx.userId);
      const workspaceId = ctx.workspaceId ?? undefined;

      console.log('[publishAsOfficialGroup] userId:', ctx.userId, 'groupId:', input.groupId, 'workspaceId:', workspaceId);

      const canPublishAll = await rbacModel.hasPermission('group:publish:all', {
        workspaceId,
      });
      const canPublishOwner = await rbacModel.hasPermission('group:publish:owner', {
        workspaceId,
      });

      console.log('[publishAsOfficialGroup] canPublishAll:', canPublishAll, 'canPublishOwner:', canPublishOwner);

      if (!canPublishAll && !canPublishOwner) {
        console.log('[publishAsOfficialGroup] FORBIDDEN - missing permission');
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Missing required permission: group:publish:all | group:publish:owner',
        });
      }

      // VIP (owner-scoped) callers submit for review instead of publishing
      // directly. The share record is set to 'pending_review' and surfaces on
      // the super_admin review queue.
      if (!canPublishAll && canPublishOwner) {
        const share = await ctx.chatGroupShareModel.submitForReview(input.groupId, ctx.userId);
        if (!share) {
          console.log('[publishAsOfficialGroup] NOT_FOUND - submitForReview returned null');
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Group not found or not owned by the caller',
          });
        }
        return { groupId: input.groupId, visibility: share.visibility };
      }

      // super_admin path: publish directly to 'official'.
      console.log('[publishAsOfficialGroup] admin path - calling publishAsOfficial with skipOwnershipCheck');
      const share = await ctx.chatGroupShareModel.publishAsOfficial(input.groupId, {
        skipOwnershipCheck: true,
      });
      console.log('[publishAsOfficialGroup] publishAsOfficial result:', share);
      if (!share) {
        console.log('[publishAsOfficialGroup] NOT_FOUND - publishAsOfficial returned null');
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found or not owned by the caller',
        });
      }
      return { groupId: input.groupId, visibility: share.visibility };
    }),

  /**
   * Take an official group down from the marketplace. Resets
   * `chat_group_shares.visibility` to `'private'`; the share row is kept so view
   * counts survive a re-publish.
   * Two permission paths:
   * - `group:publish:all` — admin can unpublish any group
   * - `group:publish:owner` — VIP can unpublish only their own groups
   */
  unpublishOfficialGroup: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rbacModel = new RbacModel(ctx.serverDB, ctx.userId);
      const workspaceId = ctx.workspaceId ?? undefined;

      const canPublishAll = await rbacModel.hasPermission('group:publish:all', {
        workspaceId,
      });
      const canPublishOwner = await rbacModel.hasPermission('group:publish:owner', {
        workspaceId,
      });

      if (!canPublishAll && !canPublishOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Missing required permission: group:publish:all | group:publish:owner',
        });
      }

      if (!canPublishAll && canPublishOwner) {
        const owned = await ctx.chatGroupModel.findById(input.groupId);
        if (!owned) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Group not found or not owned by the caller',
          });
        }
      }

      const share = await ctx.chatGroupShareModel.unpublishOfficial(input.groupId);
      if (!share) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group is not currently published as official',
        });
      }
      return { groupId: input.groupId, visibility: share.visibility };
    }),

  /**
   * Paginated list of official groups for the marketplace. Visible to all
   * signed-in users regardless of role. Optional `keyword` searches
   * title/description. Used by the discover/marketplace page to show only
   * admin-published groups.
   */
  getOfficialGroups: agentGroupProcedure
    .input(
      z
        .object({
          keyword: z.string().optional(),
          page: z.number().min(1).optional(),
          pageSize: z.number().min(1).max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      return ctx.chatGroupShareModel.getOfficialGroups(input);
    }),

  /**
   * Get a single official group's full detail for the marketplace detail page.
   * Public to all signed-in users — no ownership filter, but the group must be
   * published as `'official'` (otherwise returns null). Lets a free_user load
   * the group detail so they can install/fork it into their own account.
   */
  getOfficialGroup: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.chatGroupShareModel.getOfficialGroupDetail(input.groupId);
    }),

  /**
   * Install/fork an official group into the caller's personal space.
   * Copies the group config and its agents but NOT the chat history.
   * Idempotent — if the caller already installed this official group
   * (tracked via `config.forkedFromIdentifier`), returns the existing
   * group id with `alreadyInstalled: true` instead of creating a duplicate.
   *
   * No `agent:create` permission required: every signed-in user (including
   * free_user) can install official groups — this is a copy of an admin-published
   * group, not a from-scratch creation.
   */
  installOfficialGroup: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Load the official group source config (verifies visibility === 'official')
      const source = await ctx.chatGroupShareModel.getOfficialGroup(input.groupId);
      if (!source) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Official group not found',
        });
      }

      // 2. Idempotency: if the caller already forked this official group, return it
      const existingId = await ctx.chatGroupModel.getGroupByForkedFromIdentifier(source.id);
      if (existingId) {
        return { groupId: existingId, alreadyInstalled: true };
      }

      // 3. Fork the group and its agents to the caller's space.
      //    Chat history is intentionally NOT copied — the installed group starts
      //    clean and is fully owned by the caller.
      const result = await ctx.agentGroupRepo.copyFromOfficial(
        input.groupId,
        ctx.workspaceId ?? null,
        ctx.userId,
        source.id,
      );

      return { groupId: result?.groupId, alreadyInstalled: false };
    }),

  /**
   * Check whether a group is currently published as an official group.
   * Public read — any logged-in user can query this flag. Primarily used by
   * the group editor header to show the correct publish/unpublish action.
   */
  isOfficialGroup: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      return { isOfficial: await ctx.chatGroupShareModel.isOfficial(input.groupId) };
    }),

  // ==================== VIP Review Workflow ====================

  /**
   * Approve a pending-review group — promote it to `'official'` so it
   * appears on the marketplace. Restricted to super_admin
   * (`group:publish:all`).
   */
  approveGroupReview: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rbacModel = new RbacModel(ctx.serverDB, ctx.userId);
      const workspaceId = ctx.workspaceId ?? undefined;

      const canPublishAll = await rbacModel.hasPermission('group:publish:all', { workspaceId });
      if (!canPublishAll) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Missing required permission: group:publish:all',
        });
      }

      const share = await ctx.chatGroupShareModel.approveReview(input.groupId);
      if (!share) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group is not currently pending review',
        });
      }
      return { groupId: input.groupId, visibility: share.visibility };
    }),

  /**
   * Reject a pending-review group — reset visibility to `'private'`. The
   * share row is kept so view counts survive a future re-submission.
   * Restricted to super_admin (`group:publish:all`).
   */
  rejectGroupReview: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rbacModel = new RbacModel(ctx.serverDB, ctx.userId);
      const workspaceId = ctx.workspaceId ?? undefined;

      const canPublishAll = await rbacModel.hasPermission('group:publish:all', { workspaceId });
      if (!canPublishAll) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Missing required permission: group:publish:all',
        });
      }

      const share = await ctx.chatGroupShareModel.rejectReview(input.groupId);
      if (!share) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group is not currently pending review',
        });
      }
      return { groupId: input.groupId, visibility: share.visibility };
    }),

  /**
   * Paginated list of groups awaiting review. Restricted to super_admin
   * (`group:publish:all`). Joins `chat_groups` and `users` so the review
   * page can render group + submitter info without extra round-trips.
   */
  getPendingGroupReviews: agentGroupProcedure
    .input(
      z
        .object({
          page: z.number().min(1).optional(),
          pageSize: z.number().min(1).max(100).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const rbacModel = new RbacModel(ctx.serverDB, ctx.userId);
      const workspaceId = ctx.workspaceId ?? undefined;

      const canPublishAll = await rbacModel.hasPermission('group:publish:all', { workspaceId });
      if (!canPublishAll) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Missing required permission: group:publish:all',
        });
      }

      return ctx.chatGroupShareModel.getPendingReviews(input);
    }),

  /**
   * Check whether a group is currently awaiting review
   * (`visibility = 'pending_review'`). Public read — used by the group
   * editor header to show the "pending review" state to the VIP submitter.
   */
  isGroupPendingReview: agentGroupProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      return { isPendingReview: await ctx.chatGroupShareModel.isPendingReview(input.groupId) };
    }),
});

export type AgentGroupRouter = typeof agentGroupRouter;
