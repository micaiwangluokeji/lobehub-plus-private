import { and, count, desc, eq, gte, lte } from 'drizzle-orm';

import { workspaceAuditLogs } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type { AuditLogListRequest, AuditLogListResponse } from '../types/audit-log.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Audit log service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class AuditLogService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: AuditLogListRequest): Promise<AuditLogListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(workspaceAuditLogs.userId, request.userId));
    if (request.action) conditions.push(eq(workspaceAuditLogs.action, request.action));
    if (request.resource)
      conditions.push(eq(workspaceAuditLogs.resourceType, request.resource));
    if (request.startDate)
      conditions.push(gte(workspaceAuditLogs.createdAt, new Date(request.startDate)));
    if (request.endDate)
      conditions.push(lte(workspaceAuditLogs.createdAt, new Date(request.endDate)));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(workspaceAuditLogs)
        .where(where)
        .orderBy(desc(workspaceAuditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(workspaceAuditLogs).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}
