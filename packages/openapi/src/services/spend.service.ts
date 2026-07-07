import { and, count, desc, eq, gte, lte } from 'drizzle-orm';

import { SpendLogsModel } from '@/database/models/spendLogs';
import { spendLogs, type SpendLogItem } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  DailyCostTrendItem,
  ModelCostItem,
  SpendListRequest,
  SpendListResponse,
  TopSpenderItem,
} from '../types/spend.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Spend service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class SpendService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: SpendListRequest): Promise<SpendListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(spendLogs.userId, request.userId));
    if (request.workspaceId) conditions.push(eq(spendLogs.workspaceId, request.workspaceId));
    if (request.sessionId) conditions.push(eq(spendLogs.sessionId, request.sessionId));
    if (request.modelId) conditions.push(eq(spendLogs.modelId, request.modelId));
    if (request.providerId) conditions.push(eq(spendLogs.providerId, request.providerId));
    if (request.status) conditions.push(eq(spendLogs.status, request.status));
    if (request.createdAtAfter)
      conditions.push(gte(spendLogs.createdAt, new Date(request.createdAtAfter)));
    if (request.createdAtBefore)
      conditions.push(lte(spendLogs.createdAt, new Date(request.createdAtBefore)));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(spendLogs)
        .where(where)
        .orderBy(desc(spendLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(spendLogs).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: number): Promise<SpendLogItem | null> {
    const model = new SpendLogsModel(this.db);
    return model.getById(id);
  }

  async getDailyCostTrend(days: number = 30): Promise<DailyCostTrendItem[]> {
    const model = new SpendLogsModel(this.db);
    const rows = await model.getDailyCostTrend(days);

    return rows.map((row) => ({
      callCount: Number(row.callCount),
      date: String(row.date),
      totalCost: Number(row.totalCost),
      totalTokens: Number(row.totalTokens),
    }));
  }

  async getModelCost(params?: {
    endDate?: Date;
    startDate?: Date;
  }): Promise<ModelCostItem[]> {
    const model = new SpendLogsModel(this.db);
    const rows = await model.sumModelCost(params);

    return rows.map((row) => ({
      callCount: Number(row.callCount),
      modelId: row.modelId,
      modelName: row.modelName,
      totalCost: Number(row.totalCost),
      totalTokens: Number(row.totalTokens),
    }));
  }

  async getTopSpenders(
    limit: number = 10,
    params?: { endDate?: Date; startDate?: Date },
  ): Promise<TopSpenderItem[]> {
    const model = new SpendLogsModel(this.db);
    const rows = await model.getTopSpenders(limit, params);

    return rows.map((row) => ({
      callCount: Number(row.callCount),
      totalCost: Number(row.totalCost),
      userId: row.userId,
    }));
  }
}
