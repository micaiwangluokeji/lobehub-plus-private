import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { systemHealthChecks } from '../schemas/systemHealthChecks';
import type { SystemHealthCheckItem, NewSystemHealthCheckItem, UpdateSystemHealthCheckItem } from '../schemas/systemHealthChecks';
import type { LobeChatDatabase } from '../type';

export class SystemHealthChecksModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── CRUD ──────────────────────────────────

  list = async (params?: {
    serviceName?: string;
    status?: string;
    checkedAtAfter?: Date;
    checkedAtBefore?: Date;
    page?: number;
    pageSize?: number;
  }) => {
    const conditions: any[] = [];

    if (params?.serviceName) conditions.push(eq(systemHealthChecks.serviceName, params.serviceName));
    if (params?.status) conditions.push(eq(systemHealthChecks.status, params.status));
    if (params?.checkedAtAfter) conditions.push(gte(systemHealthChecks.checkedAt, params.checkedAtAfter));
    if (params?.checkedAtBefore) conditions.push(lte(systemHealthChecks.checkedAt, params.checkedAtBefore));

    const query = this.db.select().from(systemHealthChecks).where(conditions.length ? and(...conditions) : undefined);
    // TODO: add orderBy and pagination
    return query;
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(systemHealthChecks).where(eq(systemHealthChecks.id, id)).limit(1);
    return row || null;
  };

  create = async (data: NewSystemHealthCheckItem) => {
    const [row] = await this.db.insert(systemHealthChecks).values(data).returning();
    return row;
  };

  update = async (id: string, data: UpdateSystemHealthCheckItem) => {
    const [row] = await this.db
      .update(systemHealthChecks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemHealthChecks.id, id))
      .returning();
    return row;
  };

  delete = async (id: string) => {
    await this.db.delete(systemHealthChecks).where(eq(systemHealthChecks.id, id));
  };

  // ── Business logic ──────────────────────────────────

  /**
   * 获取系统健康状态（每个服务的最新检查结果）
   */
  getHealthStatus = async () => {
    // Get the latest health check for each service
    const rows = await this.db.select().from(systemHealthChecks).orderBy(desc(systemHealthChecks.checkedAt));
    
    const map = new Map<string, SystemHealthCheckItem>();
    for (const row of rows) {
      if (!map.has(row.serviceName)) {
        map.set(row.serviceName, row);
      }
    }

    const result: Record<string, { status: string; lastCheck: Date; responseTime?: number }> = {};
    for (const [serviceName, check] of map.entries()) {
      result[serviceName] = {
        status: check.status,
        lastCheck: check.checkedAt,
        responseTime: check.responseTime ?? undefined,
      };
    }
    return result;
  };

  /**
   * 获取服务统计
   */
  getServiceStats = async (serviceName: string, params?: { startDate?: Date; endDate?: Date }) => {
    const conditions: any[] = [eq(systemHealthChecks.serviceName, serviceName)];
    if (params?.startDate) conditions.push(gte(systemHealthChecks.checkedAt, params.startDate));
    if (params?.endDate) conditions.push(lte(systemHealthChecks.checkedAt, params.endDate));

    const where = and(...conditions);
    const [total, healthy, degraded, down, avgResult] = await Promise.all([
      this.db.$count(systemHealthChecks, where),
      this.db.$count(systemHealthChecks, and(eq(systemHealthChecks.status, 'healthy'), ...conditions)),
      this.db.$count(systemHealthChecks, and(eq(systemHealthChecks.status, 'degraded'), ...conditions)),
      this.db.$count(systemHealthChecks, and(eq(systemHealthChecks.status, 'down'), ...conditions)),
      this.db
        .select({ avg: sql<number>`avg(${systemHealthChecks.responseTime})` })
        .from(systemHealthChecks)
        .where(where)
        .then((rows) => rows[0]?.avg ?? 0),
    ]);

    return { total, healthy, degraded, down, avgResponseTime: avgResult };
  };
}
