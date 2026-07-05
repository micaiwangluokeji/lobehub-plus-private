import { and, count, desc, eq, ilike, or } from 'drizzle-orm';

import type { LobeChatDatabase } from '@/database/type';

import type { AgentItem } from '../schemas';
import { agents, agentShares, users } from '../schemas';
import { buildWorkspaceWhere } from '../utils/workspace';

/**
 * A published "official" agent row — the marketplace-facing projection of an
 * agent whose `agent_shares.visibility` is `'official'`. Visible to every
 * signed-in user regardless of ownership; the underlying agent config is still
 * owned by the admin who published it.
 */
export interface OfficialAgentItem {
  agentId: string;
  avatar: string | null;
  backgroundColor: string | null;
  description: string | null;
  slug: string | null;
  title: string | null;
  updatedAt: Date | null;
  /** Visitor count on the share record, surfaced as a popularity signal. */
  viewCount: number;
}

export interface OfficialAgentListResult {
  items: OfficialAgentItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * An agent awaiting review — an agent whose `agent_shares.visibility` is
 * `'pending_review'`, submitted by a VIP user. Surfaced to super_admins on
 * the review page so they can approve (flip to `'official'`) or reject
 * (reset to `'private'`).
 */
export interface PendingReviewAgentItem {
  agentId: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  backgroundColor: string | null;
  slug: string | null;
  submittedAt: Date | null;
  submitterId: string | null;
  submitterUsername: string | null;
  submitterFullName: string | null;
  submitterAvatar: string | null;
}

export class AgentShareModel {
  private userId: string;
  private db: LobeChatDatabase;
  private workspaceId?: string;

  constructor(db: LobeChatDatabase, userId: string, workspaceId?: string) {
    this.userId = userId;
    this.db = db;
    this.workspaceId = workspaceId;
  }

  /**
   * Compat-mode ownership predicate for the `agents` table, mirroring
   * `AgentModel.ownership`. Used to assert the caller actually owns the agent
   * before publishing it as official.
   */
  private ownership = () =>
    buildWorkspaceWhere({ userId: this.userId, workspaceId: this.workspaceId }, agents);

  /**
   * Publish an agent to the marketplace as an official agent.
   * - Verifies the caller owns the agent (ownership gate), unless
   *   `skipOwnershipCheck` is set (super_admin with `agent:update:all`).
   * - Upserts the `agent_shares` row: sets `visibility = 'official'`.
   *   A pre-existing 'link'/'private' share record is upgraded to 'official';
   *   if no record exists, a new one is created.
   * Returns the resulting share record.
   */
  publishAsOfficial = async (agentId: string, options?: { skipOwnershipCheck?: boolean }) => {
    // Ownership gate: only the agent's owner (or a workspace admin) can publish it.
    // Skipped for super_admin (agent:update:all) so they can publish agents they
    // did not create.
    if (!options?.skipOwnershipCheck) {
      const [owned] = await this.db
        .select({ id: agents.id })
        .from(agents)
        .where(and(eq(agents.id, agentId), this.ownership()))
        .limit(1);

      if (!owned) {
        return null;
      }
    }

    const [row] = await this.db
      .insert(agentShares)
      .values({
        agentId,
        visibility: 'official',
      })
      .onConflictDoUpdate({
        set: { visibility: 'official', updatedAt: new Date() },
        target: agentShares.agentId,
      })
      .returning();

    return row;
  };

  /**
   * Take down an official agent from the marketplace.
   * - Only acts when the share record is currently `'official'`.
   * - Resets visibility to `'private'` (keeps the row so analytics/view count
   *   are preserved). Owners can re-publish later.
   * Returns the updated row, or `null` if no official share existed.
   */
  unpublishOfficial = async (agentId: string) => {
    const [existing] = await this.db
      .select()
      .from(agentShares)
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'official')))
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(agentShares)
      .set({ visibility: 'private', updatedAt: new Date() })
      .where(eq(agentShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Check whether an agent is currently published as official.
   */
  isOfficial = async (agentId: string): Promise<boolean> => {
    const [row] = await this.db
      .select({ id: agentShares.id })
      .from(agentShares)
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'official')))
      .limit(1);
    return Boolean(row);
  };

  /**
   * Fetch the agent config for an official agent. Unlike `AgentModel` lookups,
   * this bypasses ownership — official agents are visible to all users, so a
   * free_user reading the marketplace can load the agent detail to install it.
   * Returns `null` when the agent is not published as official.
   */
  getOfficialAgent = async (agentId: string): Promise<AgentItem | null> => {
    const [row] = await this.db
      .select({
        agent: agents,
      })
      .from(agentShares)
      .innerJoin(agents, eq(agentShares.agentId, agents.id))
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'official')))
      .limit(1);

    return row?.agent ?? null;
  };

  /**
   * Paginated list of official agents for the marketplace.
   * Visible to all signed-in users — no ownership filter. Optional keyword
   * searches title/description. Ordered by `updatedAt` desc (most recently
   * updated first).
   */
  getOfficialAgents = async (params?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OfficialAgentListResult> => {
    const { keyword, page = 1, pageSize = 20 } = params ?? {};
    const offset = (page - 1) * pageSize;

    const baseWhere = eq(agentShares.visibility, 'official');
    const where = keyword
      ? and(
          baseWhere,
          or(ilike(agents.title, `%${keyword}%`), ilike(agents.description, `%${keyword}%`)),
        )
      : baseWhere;

    const [rows, total] = await Promise.all([
      this.db
        .select({
          agentId: agents.id,
          avatar: agents.avatar,
          backgroundColor: agents.backgroundColor,
          description: agents.description,
          slug: agents.slug,
          title: agents.title,
          updatedAt: agents.updatedAt,
          viewCount: agentShares.userViewCount,
        })
        .from(agentShares)
        .innerJoin(agents, eq(agentShares.agentId, agents.id))
        .where(where)
        .orderBy(desc(agents.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(agentShares)
        .innerJoin(agents, eq(agentShares.agentId, agents.id))
        .where(where),
    ]);

    return {
      items: rows,
      page,
      pageSize,
      totalCount: total[0]?.value ?? 0,
    };
  };

  // ==================== VIP Review Workflow ====================

  /**
   * Submit an agent for review by a super_admin. Called by VIP users
   * (`agent:publish:owner`) — instead of publishing directly to `'official'`,
   * the share record is upserted with `visibility = 'pending_review'` so it
   * appears on the admin review queue.
   * - `userId` is the submitter (the VIP caller); ownership must already have
   *   been asserted at the router layer.
   * - Upserts the `agent_shares` row: a pre-existing record is switched to
   *   `'pending_review'`; if no record exists, a new one is created.
   * Returns the resulting share record.
   */
  submitForReview = async (agentId: string, userId: string) => {
    // Ownership gate: only the agent's owner can submit it for review. The
    // super_admin path never reaches here (admins publish directly), so this
    // check is always active.
    const [owned] = await this.db
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.id, agentId), this.ownership()))
      .limit(1);

    if (!owned) {
      return null;
    }

    const [row] = await this.db
      .insert(agentShares)
      .values({
        agentId,
        visibility: 'pending_review',
      })
      .onConflictDoUpdate({
        set: { visibility: 'pending_review', updatedAt: new Date() },
        target: agentShares.agentId,
      })
      .returning();

    return row;
  };

  /**
   * Approve a pending-review agent — promote it to `'official'` so it
   * appears on the marketplace. Only acts when the share record is currently
   * `'pending_review'`; returns `null` otherwise (no-op for agents that were
   * never submitted or have already been resolved).
   * Returns the updated share row.
   */
  approveReview = async (agentId: string) => {
    const [existing] = await this.db
      .select()
      .from(agentShares)
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'pending_review')))
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(agentShares)
      .set({ visibility: 'official', updatedAt: new Date() })
      .where(eq(agentShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Reject a pending-review agent — reset visibility to `'private'`. The
   * share row is kept so view counts survive a future re-submission. Only
   * acts when the share record is currently `'pending_review'`; returns
   * `null` otherwise.
   * Returns the updated share row.
   */
  rejectReview = async (agentId: string) => {
    const [existing] = await this.db
      .select()
      .from(agentShares)
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'pending_review')))
      .limit(1);

    if (!existing) return null;

    const [row] = await this.db
      .update(agentShares)
      .set({ visibility: 'private', updatedAt: new Date() })
      .where(eq(agentShares.id, existing.id))
      .returning();

    return row;
  };

  /**
   * Paginated list of agents awaiting review (`visibility = 'pending_review'`).
   * Joins `agents` (for title/description/avatar) and `users` (for the
   * submitter's display info) so the review page can render without extra
   * round-trips. Ordered by `agent_shares.updatedAt` desc (most recently
   * submitted first).
   */
  getPendingReviews = async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: PendingReviewAgentItem[]; page: number; pageSize: number; totalCount: number }> => {
    const { page = 1, pageSize = 20 } = params ?? {};
    const offset = (page - 1) * pageSize;

    const where = eq(agentShares.visibility, 'pending_review');

    const [rows, total] = await Promise.all([
      this.db
        .select({
          agentId: agents.id,
          title: agents.title,
          description: agents.description,
          avatar: agents.avatar,
          backgroundColor: agents.backgroundColor,
          slug: agents.slug,
          submittedAt: agentShares.updatedAt,
          submitterId: agents.userId,
          submitterUsername: users.username,
          submitterFullName: users.fullName,
          submitterAvatar: users.avatar,
        })
        .from(agentShares)
        .innerJoin(agents, eq(agentShares.agentId, agents.id))
        .leftJoin(users, eq(agents.userId, users.id))
        .where(where)
        .orderBy(desc(agentShares.updatedAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(agentShares)
        .innerJoin(agents, eq(agentShares.agentId, agents.id))
        .where(where),
    ]);

    return {
      items: rows.map((row) => ({
        agentId: row.agentId,
        title: row.title,
        description: row.description,
        avatar: row.avatar,
        backgroundColor: row.backgroundColor,
        slug: row.slug,
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
   * Check whether an agent is currently awaiting review
   * (`visibility = 'pending_review'`).
   */
  isPendingReview = async (agentId: string): Promise<boolean> => {
    const [row] = await this.db
      .select({ id: agentShares.id })
      .from(agentShares)
      .where(and(eq(agentShares.agentId, agentId), eq(agentShares.visibility, 'pending_review')))
      .limit(1);
    return Boolean(row);
  };
}
