import { and, desc, eq, gte, like, lt, lte, or, sql } from 'drizzle-orm';

import { workspaceAuditLogs } from '../schemas/workspace';
import type { LobeChatDatabase } from '../type';

export type WorkspaceAuditAction =
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.upgraded'
  | 'workspace.downgraded'
  | 'workspace.primary_ownership_transferred'
  | 'workspace.deleted'
  | 'workspace.cleanup_triggered'
  | 'workspace.account_upgraded'
  | 'workspace.data_cleared'
  | 'workspace.settings_reset'
  | 'member.invited'
  | 'member.removed'
  | 'member.role_updated'
  | 'member.joined'
  | 'member.left'
  | 'member.promoted_to_owner'
  | 'member.demoted_from_owner'
  | 'invitation.revoked'
  | 'invitation.resent'
  | 'subscription.activated'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.cancellation_scheduled'
  | 'subscription.cancellation_resumed'
  | 'subscription.grace_period_started'
  | 'billing.portal_session_created'
  | 'billing.payment_method_added'
  | 'billing.payment_method_removed'
  | 'billing.default_payment_method_changed';

interface CreateAuditLogParams {
  action: WorkspaceAuditAction;
  ipAddress?: string;
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceType?: string;
  userId: string | null;
  workspaceId: string;
}

interface ListAuditLogParams {
  action?: WorkspaceAuditAction;
  cursor?: Date;
  endDate?: Date;
  limit?: number;
  startDate?: Date;
  workspaceId: string;
}

interface AdminListAuditLogParams {
  action?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
  resourceType?: string;
}

export class WorkspaceAuditLogModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  create = async (params: CreateAuditLogParams) => {
    const [row] = await this.db
      .insert(workspaceAuditLogs)
      .values({
        action: params.action,
        ipAddress: params.ipAddress,
        metadata: params.metadata ?? {},
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        userId: params.userId,
        workspaceId: params.workspaceId,
      })
      .returning();
    return row;
  };

  list = async (params: ListAuditLogParams) => {
    const { workspaceId, action, startDate, endDate, cursor, limit = 50 } = params;
    const conditions = [eq(workspaceAuditLogs.workspaceId, workspaceId)];
    if (action) conditions.push(eq(workspaceAuditLogs.action, action));
    if (startDate) conditions.push(gte(workspaceAuditLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(workspaceAuditLogs.createdAt, endDate));
    if (cursor) conditions.push(lt(workspaceAuditLogs.createdAt, cursor));

    const rows = await this.db.query.workspaceAuditLogs.findMany({
      limit: limit + 1,
      orderBy: [desc(workspaceAuditLogs.createdAt)],
      where: and(...conditions),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items.at(-1)?.createdAt?.toISOString() : null;

    return { items, nextCursor };
  };

  /**
   * Admin list — queries across all workspaces with optional filters.
   * Designed for the admin panel (super_admin only).
   */
  adminList = async (params: AdminListAuditLogParams) => {
    const { action, keyword, resourceType, limit = 50, offset = 0 } = params;
    const conditions: ReturnType<typeof eq>[] = [];

    if (action) conditions.push(eq(workspaceAuditLogs.action, action as WorkspaceAuditAction));
    if (resourceType) conditions.push(eq(workspaceAuditLogs.resourceType, resourceType));
    if (keyword) {
      conditions.push(
        or(
          like(workspaceAuditLogs.resourceId, `%${keyword}%`),
          like(workspaceAuditLogs.resourceType, `%${keyword}%`),
        ) as any,
      );
    }

    const rows = await this.db.query.workspaceAuditLogs.findMany({
      limit,
      offset,
      orderBy: [desc(workspaceAuditLogs.createdAt)],
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });

    return rows;
  };

  getById = async (id: string) => {
    const [row] = await this.db
      .select()
      .from(workspaceAuditLogs)
      .where(eq(workspaceAuditLogs.id, id))
      .limit(1);
    return row || null;
  };

  adminCount = async (params: AdminListAuditLogParams) => {
    const { action, keyword, resourceType } = params;
    const conditions: ReturnType<typeof eq>[] = [];

    if (action) conditions.push(eq(workspaceAuditLogs.action, action as WorkspaceAuditAction));
    if (resourceType) conditions.push(eq(workspaceAuditLogs.resourceType, resourceType));
    if (keyword) {
      conditions.push(
        or(
          like(workspaceAuditLogs.resourceId, `%${keyword}%`),
          like(workspaceAuditLogs.resourceType, `%${keyword}%`),
        ) as any,
      );
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceAuditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(result[0]?.count ?? 0);
  };
}
