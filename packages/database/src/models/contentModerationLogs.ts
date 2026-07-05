import { and, eq, gte, lte } from 'drizzle-orm';

import { contentModerationLogs } from '../schemas/contentModerationLogs';
import type { ContentModerationLogItem, NewContentModerationLogItem, UpdateContentModerationLogItem } from '../schemas/contentModerationLogs';
import type { LobeChatDatabase } from '../type';

export class ContentModerationLogsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── CRUD ──────────────────────────────────

  list = async (params?: {
    userId?: string;
    contentType?: string;
    moderationResult?: string;
    status?: string;
    createdAtAfter?: Date;
    createdAtBefore?: Date;
    page?: number;
    pageSize?: number;
  }) => {
    const conditions: any[] = [];

    if (params?.userId) conditions.push(eq(contentModerationLogs.userId, params.userId));
    if (params?.contentType) conditions.push(eq(contentModerationLogs.contentType, params.contentType));
    if (params?.moderationResult) conditions.push(eq(contentModerationLogs.moderationResult, params.moderationResult));
    if (params?.status) conditions.push(eq(contentModerationLogs.status, params.status));
    if (params?.createdAtAfter) conditions.push(gte(contentModerationLogs.createdAt, params.createdAtAfter));
    if (params?.createdAtBefore) conditions.push(lte(contentModerationLogs.createdAt, params.createdAtBefore));

    const query = this.db.select().from(contentModerationLogs).where(conditions.length ? and(...conditions) : undefined);
    // TODO: add orderBy and pagination
    return query;
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(contentModerationLogs).where(eq(contentModerationLogs.id, id)).limit(1);
    return row || null;
  };

  create = async (data: NewContentModerationLogItem) => {
    const [row] = await this.db.insert(contentModerationLogs).values(data).returning();
    return row;
  };

  update = async (id: string, data: UpdateContentModerationLogItem) => {
    const [row] = await this.db
      .update(contentModerationLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentModerationLogs.id, id))
      .returning();
    return row;
  };

  delete = async (id: string) => {
    await this.db.delete(contentModerationLogs).where(eq(contentModerationLogs.id, id));
  };

  // ── Business logic ──────────────────────────────────

  /**
   * 获取审核统计
   */
  getModerationStats = async (params?: {
    startDate?: Date;
    endDate?: Date;
  }) => {
    const conditions: any[] = [];
    if (params?.startDate) conditions.push(gte(contentModerationLogs.createdAt, params.startDate));
    if (params?.endDate) conditions.push(lte(contentModerationLogs.createdAt, params.endDate));

    const where = conditions.length ? and(...conditions) : undefined;
    const [total, safe, flagged, blocked, pending] = await Promise.all([
      this.db.$count(contentModerationLogs, where),
      this.db.$count(contentModerationLogs, and(eq(contentModerationLogs.moderationResult, 'safe'), ...conditions)),
      this.db.$count(contentModerationLogs, and(eq(contentModerationLogs.moderationResult, 'flagged'), ...conditions)),
      this.db.$count(contentModerationLogs, and(eq(contentModerationLogs.moderationResult, 'blocked'), ...conditions)),
      this.db.$count(contentModerationLogs, and(eq(contentModerationLogs.status, 'pending'), ...conditions)),
    ]);

    return { total, safe, flagged, blocked, pending };
  };
}
