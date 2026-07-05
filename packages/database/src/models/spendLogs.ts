import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import {
  spendLogs,
  type NewSpendLogItem,
  type SpendLogItem,
  type UpdateSpendLogItem,
} from '../schemas/spendLogs';
import type { LobeChatDatabase } from '../type';

export class SpendLogsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── CRUD ─────────────────────────────────────────

  list = async (params?: {
    userId?: string;
    workspaceId?: string;
    sessionId?: string;
    modelId?: string;
    providerId?: string;
    status?: string;
    createdAtAfter?: Date;
    createdAtBefore?: Date;
    page?: number;
    pageSize?: number;
  }) => {
    const conditions: any[] = [];

    if (params?.userId) conditions.push(eq(spendLogs.userId, params.userId));
    if (params?.workspaceId) conditions.push(eq(spendLogs.workspaceId, params.workspaceId));
    if (params?.sessionId) conditions.push(eq(spendLogs.sessionId, params.sessionId));
    if (params?.modelId) conditions.push(eq(spendLogs.modelId, params.modelId));
    if (params?.providerId) conditions.push(eq(spendLogs.providerId, params.providerId));
    if (params?.status) conditions.push(eq(spendLogs.status, params.status));
    if (params?.createdAtAfter) conditions.push(gte(spendLogs.createdAt, params.createdAtAfter));
    if (params?.createdAtBefore) conditions.push(lte(spendLogs.createdAt, params.createdAtBefore));

    const query = this.db
      .select()
      .from(spendLogs)
      .where(and(...conditions))
      .orderBy(desc(spendLogs.createdAt));
    // TODO: add pagination
    return query;
  };

  getById = async (id: number) => {
    const [row] = await this.db
      .select()
      .from(spendLogs)
      .where(eq(spendLogs.id, id))
      .limit(1);
    return row || null;
  };

  create = async (data: NewSpendLogItem) => {
    const [row] = await this.db.insert(spendLogs).values(data).returning();
    return row;
  };

  // ── Statistics ────────────────────────────────────

  /**
   * 统计用户的消费总额（不传 userId 则统计所有用户）
   */
  sumUserCost = async (params?: { userId?: string; startDate?: Date; endDate?: Date }) => {
    const conditions: any[] = [];

    if (params?.userId) conditions.push(eq(spendLogs.userId, params.userId));
    if (params?.startDate) conditions.push(gte(spendLogs.createdAt, params.startDate));
    if (params?.endDate) conditions.push(lte(spendLogs.createdAt, params.endDate));

    const result = await this.db
      .select({
        totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
        totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
        totalCreditsConsumed: sql<number>`coalesce(sum(${spendLogs.creditsConsumed}), 0)`,
      })
      .from(spendLogs)
      .where(and(...conditions));

    return (
      result[0] || {
        totalCost: 0,
        totalTokens: 0,
        totalCreditsConsumed: 0,
      }
    );
  };

  /**
   * 统计模型的消费总额
   */
  sumModelCost = async (params?: { startDate?: Date; endDate?: Date }) => {
    const conditions: any[] = [];

    if (params?.startDate) conditions.push(gte(spendLogs.createdAt, params.startDate));
    if (params?.endDate) conditions.push(lte(spendLogs.createdAt, params.endDate));

    return this.db
      .select({
        modelId: spendLogs.modelId,
        modelName: spendLogs.modelName,
        totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
        totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
        callCount: sql<number>`count(*)`,
      })
      .from(spendLogs)
      .where(and(...conditions))
      .groupBy(spendLogs.modelId, spendLogs.modelName)
      .orderBy(desc(sql`sum(${spendLogs.totalCost})`));
  };

  /**
   * 统计每日消费趋势
   */
  getDailyCostTrend = async (days: number = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.db
      .select({
        date: sql<string>`date(${spendLogs.createdAt})`,
        totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
        totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
        callCount: sql<number>`count(*)`,
      })
      .from(spendLogs)
      .where(gte(spendLogs.createdAt, startDate))
      .groupBy(sql`date(${spendLogs.createdAt})`)
      .orderBy(sql`date(${spendLogs.createdAt})`);
  };

  /**
   * 获取消费排行榜（按用户）
   */
  getTopSpenders = async (limit: number = 10, params?: { startDate?: Date; endDate?: Date }) => {
    const conditions: any[] = [];

    if (params?.startDate) conditions.push(gte(spendLogs.createdAt, params.startDate));
    if (params?.endDate) conditions.push(lte(spendLogs.createdAt, params.endDate));

    return this.db
      .select({
        userId: spendLogs.userId,
        totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
        totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
        callCount: sql<number>`count(*)`,
      })
      .from(spendLogs)
      .where(and(...conditions))
      .groupBy(spendLogs.userId)
      .orderBy(desc(sql`sum(${spendLogs.totalCost})`))
      .limit(limit);
  };
}
