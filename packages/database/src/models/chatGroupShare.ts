import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';

import type { ChatGroupAgentItem, ChatGroupItem } from '../schemas';
import { agents, chatGroupShares, chatGroups, chatGroupsAgents, users } from '../schemas';
import type { LobeChatDatabase } from '../type';
import { buildWorkspaceWhere } from '../utils/workspace';

/**
 * A published "official" group row — the marketplace-facing projection of a
 * chat group whose `chat_group_shares.visibility` is `'official'`. Visible to
 * every signed-in user regardless of ownership; the underlying group config is
 * still owned by the admin who published it.
 */
export interface OfficialGroupItem {
  groupId: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  backgroundColor: string | null;
  memberCount: number;
  updatedAt: Date | null;
  viewCount: number;
}

export interface OfficialGroupListResult {
  items: OfficialGroupItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * A group awaiting review — a chat group whose `chat_group_shares.visibility`
 * is `'pending_review'`, submitted by a VIP user. Surfaced to super_admins on
 * the review page so they can approve (flip to `'official'`) or reject
 * (reset to `'private'`).
 */
export interface PendingReviewGroupItem {
  groupId: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  backgroundColor: string | null;
  submittedAt: Date | null;
  submitterId: string | null;
  submitterUsername: string | null;
  submitterFullName: string | null;
  submitterAvatar: string | null;
}

export class ChatGroupShareModel {
  private userId: string;
  private db: LobeChatDatabase;
  private workspaceId?: string;

  constructor(db: LobeChatDatabase, userId: string, workspaceId?: string) {
    this.userId = userId;
    this.db = db;
    this.workspaceId = workspaceId;
  }

  /**
   * Compat-mode ownership predicate for the `chat_groups` table, mirroring
   * `ChatGroupModel.ownership`. Used to assert the caller actually owns the
   * group before publishing it as official.
   */
  private ownership = () =>
    buildWorkspaceWhere({ userId: this.userId, workspaceId: this.workspaceId }, chatGroups);

  /**
   * Publish a chat group to the marketplace as an official group.
   * - Verifies the caller owns the group (ownership gate), unless
   *   `skipOwnershipCheck` is set (super_admin with `group:publish:all`).
   * - Upserts the `chat_group_shares` row: sets `visibility = 'official'`.
   *   A pre-existing 'link'/'private' share record is upgraded to 'official';
   *   if no record exists, a new one is created.
   * Returns the resulting share record.
   */
  publishAsOfficial = async (
    chatGroupId: string,
    options?: { skipOwnershipCheck?: boolean },
  ) => {
    console.log('[ChatGroupShareModel.publishAsOfficial] chatGroupId:', chatGroupId, 'skipOwnershipCheck:', options?.skipOwnershipCheck, 'workspaceId:', this.workspaceId);

    // Ownership gate: only the group's owner (or a workspace admin) can publish it.
    // Skipped for super_admin (group:publish:all) so they can publish groups they
    // did not create.
    if (!options?.skipOwnershipCheck) {
      const ownershipWhere = this.ownership();
      console.log('[ChatGroupShareModel.publishAsOfficial] ownership check');
      const [owned] = await this.db
        .select({ id: chatGroups.id })
        .from(chatGroups)
        .where(and(eq(chatGroups.id, chatGroupId), ownershipWhere))
        .limit(1);

      console.log('[ChatGroupShareModel.publishAsOfficial] ownership result:', owned);

      if (!owned) {
        return null;
      }
    }

    console.log('[ChatGroupShareModel.publishAsOfficial] upserting chat_group_shares');
    try {
      const [row] = await this.db
        .insert(chatGroupShares)
        .values({
          chatGroupId,
          visibility: 'official',
        })
        .onConflictDoUpdate({
          set: { visibility: 'official', updatedAt: new Date() },
          target: chatGroupShares.chatGroupId,
        })
        .returning();

      console.log('[ChatGroupShareModel.publishAsOfficial] upsert result:', row);
      return row;
    } catch (err) {
      console.error('[ChatGroupShareModel.publishAsOfficial] upsert error:', err);
      throw err;
    }
  };

  /**
   * Take down an official group from the marketplace.
   * - Only acts when the share record is currently `'official'`.
   * - Resets visibility to `'private'` (keeps the row so analytics/view count
   *   are preserved). Owners can re-publish later.
   * Returns the updated row, or `null` if no official share existed.
   */
  unpublishOfficial = async (chatGroupId: string) => {
    const [existing] = await this.db
      .select()
      .from(chatGroupShares)
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'official'),
        ),
      )
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(chatGroupShares)
      .set({ visibility: 'private', updatedAt: new Date() })
      .where(eq(chatGroupShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Check whether a chat group is currently published as official.
   */
  isOfficial = async (chatGroupId: string): Promise<boolean> => {
    const [row] = await this.db
      .select({ id: chatGroupShares.id })
      .from(chatGroupShares)
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'official'),
        ),
      )
      .limit(1);
    return Boolean(row);
  };

  /**
   * Fetch the chat group config for an official group. Unlike `ChatGroupModel`
   * lookups, this bypasses ownership — official groups are visible to all
   * users, so a free_user reading the marketplace can load the group detail to
   * install it. Returns `null` when the group is not published as official.
   */
  getOfficialGroup = async (chatGroupId: string): Promise<ChatGroupItem | null> => {
    const [row] = await this.db
      .select({
        group: chatGroups,
      })
      .from(chatGroupShares)
      .innerJoin(chatGroups, eq(chatGroupShares.chatGroupId, chatGroups.id))
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'official'),
        ),
      )
      .limit(1);

    return row?.group ?? null;
  };

  /**
   * Paginated list of official groups for the marketplace.
   * Visible to all signed-in users — no ownership filter. Optional keyword
   * searches title/description. Ordered by `updatedAt` desc (most recently
   * updated first).
   */
  getOfficialGroups = async (params?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OfficialGroupListResult> => {
    const { keyword, page = 1, pageSize = 20 } = params ?? {};
    const offset = (page - 1) * pageSize;

    const baseWhere = eq(chatGroupShares.visibility, 'official');
    const where = keyword
      ? and(
          baseWhere,
          or(
            ilike(chatGroups.title, `%${keyword}%`),
            ilike(chatGroups.description, `%${keyword}%`),
          ),
        )
      : baseWhere;

    const [rows, total] = await Promise.all([
      this.db
        .select({
          groupId: chatGroups.id,
          title: chatGroups.title,
          description: chatGroups.description,
          avatar: chatGroups.avatar,
          backgroundColor: chatGroups.backgroundColor,
          updatedAt: chatGroups.updatedAt,
          viewCount: chatGroupShares.userViewCount,
        })
        .from(chatGroupShares)
        .innerJoin(chatGroups, eq(chatGroupShares.chatGroupId, chatGroups.id))
        .where(where)
        .orderBy(desc(chatGroups.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(chatGroupShares)
        .innerJoin(chatGroups, eq(chatGroupShares.chatGroupId, chatGroups.id))
        .where(where),
    ]);

    // Fetch member counts for the returned group IDs
    const groupIds = rows.map((r) => r.groupId);
    const memberCountMap = new Map<string, number>();

    if (groupIds.length > 0) {
      const memberRows = await this.db
        .select({
          chatGroupId: chatGroupsAgents.chatGroupId,
          memberCount: count(),
        })
        .from(chatGroupsAgents)
        .where(inArray(chatGroupsAgents.chatGroupId, groupIds))
        .groupBy(chatGroupsAgents.chatGroupId);

      for (const row of memberRows) {
        memberCountMap.set(row.chatGroupId, row.memberCount);
      }
    }

    return {
      items: rows.map((row) => ({
        ...row,
        memberCount: memberCountMap.get(row.groupId) ?? 0,
      })),
      page,
      pageSize,
      totalCount: total[0]?.value ?? 0,
    };
  };

  /**
   * Fetch the full detail for an official group, including its agents.
   * Bypasses ownership — official groups are visible to all users.
   * Returns `null` when the group is not published as official.
   */
  getOfficialGroupDetail = async (
    chatGroupId: string,
  ): Promise<{
    agents: Array<ChatGroupAgentItem & { agent: ChatGroupItem }>;
    group: ChatGroupItem;
  } | null> => {
    const group = await this.getOfficialGroup(chatGroupId);
    if (!group) return null;

    // Fetch agents without ownership filter — this is a public official group
    const agentRows = await this.db
      .select({
        agent: agents,
        chatGroupId: chatGroupsAgents.chatGroupId,
        enabled: chatGroupsAgents.enabled,
        order: chatGroupsAgents.order,
        role: chatGroupsAgents.role,
      })
      .from(chatGroupsAgents)
      .innerJoin(agents, eq(chatGroupsAgents.agentId, agents.id))
      .where(eq(chatGroupsAgents.chatGroupId, chatGroupId))
      .orderBy(chatGroupsAgents.order);

    return {
      agents: agentRows.map((row) => ({
        agent: row.agent,
        chatGroupId: row.chatGroupId,
        enabled: row.enabled,
        order: row.order,
        role: row.role,
      })) as any,
      group,
    };
  };

  // ==================== VIP Review Workflow ====================

  /**
   * Submit a chat group for review by a super_admin. Called by VIP users
   * (`group:publish:owner`) — instead of publishing directly to `'official'`,
   * the share record is upserted with `visibility = 'pending_review'` so it
   * appears on the admin review queue.
   * - `userId` is the submitter (the VIP caller); ownership must already have
   *   been asserted at the router layer.
   * - Upserts the `chat_group_shares` row: a pre-existing record is switched
   *   to `'pending_review'`; if no record exists, a new one is created.
   * Returns the resulting share record.
   */
  submitForReview = async (chatGroupId: string, userId: string) => {
    // Ownership gate: only the group's owner can submit it for review. The
    // super_admin path never reaches here (admins publish directly), so this
    // check is always active.
    const [owned] = await this.db
      .select({ id: chatGroups.id, ownerId: chatGroups.userId })
      .from(chatGroups)
      .where(and(eq(chatGroups.id, chatGroupId), this.ownership()))
      .limit(1);

    if (!owned) {
      return null;
    }

    const [row] = await this.db
      .insert(chatGroupShares)
      .values({
        chatGroupId,
        visibility: 'pending_review',
      })
      .onConflictDoUpdate({
        set: { visibility: 'pending_review', updatedAt: new Date() },
        target: chatGroupShares.chatGroupId,
      })
      .returning();

    return row;
  };

  /**
   * Approve a pending-review group — promote it to `'official'` so it
   * appears on the marketplace. Only acts when the share record is currently
   * `'pending_review'`; returns `null` otherwise (no-op for groups that were
   * never submitted or have already been resolved).
   * Returns the updated share row.
   */
  approveReview = async (chatGroupId: string) => {
    const [existing] = await this.db
      .select()
      .from(chatGroupShares)
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'pending_review'),
        ),
      )
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(chatGroupShares)
      .set({ visibility: 'official', updatedAt: new Date() })
      .where(eq(chatGroupShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Reject a pending-review group — reset visibility to `'private'`. The
   * share row is kept so view counts survive a future re-submission. Only
   * acts when the share record is currently `'pending_review'`; returns
   * `null` otherwise.
   * Returns the updated share row.
   */
  rejectReview = async (chatGroupId: string) => {
    const [existing] = await this.db
      .select()
      .from(chatGroupShares)
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'pending_review'),
        ),
      )
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(chatGroupShares)
      .set({ visibility: 'private', updatedAt: new Date() })
      .where(eq(chatGroupShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Paginated list of groups awaiting review (`visibility = 'pending_review'`).
   * Joins `chat_groups` (for title/description/avatar) and `users` (for the
   * submitter's display info) so the review page can render without extra
   * round-trips. Ordered by `chat_group_shares.updatedAt` desc (most recently
   * submitted first).
   */
  getPendingReviews = async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: PendingReviewGroupItem[]; page: number; pageSize: number; totalCount: number }> => {
    const { page = 1, pageSize = 20 } = params ?? {};
    const offset = (page - 1) * pageSize;

    const where = eq(chatGroupShares.visibility, 'pending_review');

    const [rows, total] = await Promise.all([
      this.db
        .select({
          groupId: chatGroups.id,
          title: chatGroups.title,
          description: chatGroups.description,
          avatar: chatGroups.avatar,
          backgroundColor: chatGroups.backgroundColor,
          submittedAt: chatGroupShares.updatedAt,
          submitterId: chatGroups.userId,
          submitterUsername: users.username,
          submitterFullName: users.fullName,
          submitterAvatar: users.avatar,
        })
        .from(chatGroupShares)
        .innerJoin(chatGroups, eq(chatGroupShares.chatGroupId, chatGroups.id))
        .leftJoin(users, eq(chatGroups.userId, users.id))
        .where(where)
        .orderBy(desc(chatGroupShares.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(chatGroupShares)
        .innerJoin(chatGroups, eq(chatGroupShares.chatGroupId, chatGroups.id))
        .where(where),
    ]);

    return {
      items: rows.map((row) => ({
        groupId: row.groupId,
        title: row.title,
        description: row.description,
        avatar: row.avatar,
        backgroundColor: row.backgroundColor,
        submittedAt: row.submittedAt,
        submitterId: row.submitterId,
        submitterUsername: row.submitterUsername,
        submitterFullName: row.submitterFullName,
        submitterAvatar: row.submitterAvatar,
      })),
      page,
      pageSize,
      totalCount: total[0]?.value ?? 0,
    };
  };

  /**
   * Check whether a chat group is currently awaiting review
   * (`visibility = 'pending_review'`).
   */
  isPendingReview = async (chatGroupId: string): Promise<boolean> => {
    const [row] = await this.db
      .select({ id: chatGroupShares.id })
      .from(chatGroupShares)
      .where(
        and(
          eq(chatGroupShares.chatGroupId, chatGroupId),
          eq(chatGroupShares.visibility, 'pending_review'),
        ),
      )
      .limit(1);
    return Boolean(row);
  };
}
