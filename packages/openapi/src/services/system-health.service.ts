import { count, desc } from 'drizzle-orm';

import { SystemHealthChecksModel } from '@/database/models/systemHealthChecks';
import { systemHealthChecks } from '@/database/schemas/systemHealthChecks';
import type { LobeChatDatabase } from '@/database/type';

import type {
  SystemHealthChecksListRequest,
  SystemHealthChecksListResponse,
  SystemHealthDashboard,
  SystemHealthDashboardCheck,
} from '../types/system-health.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * System health service — admin-level aggregation over system_health_checks table.
 * Does not extend BaseService (no per-user scoping).
 */
export class SystemHealthService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  /**
   * Get aggregated system health dashboard.
   * Returns the latest check status per service and an overall status.
   */
  async getDashboard(): Promise<SystemHealthDashboard> {
    const model = new SystemHealthChecksModel(this.db);
    const healthStatus = await model.getHealthStatus();

    const checks: SystemHealthDashboardCheck[] = Object.entries(healthStatus).map(
      ([serviceName, info]) => ({
        lastCheck: info.lastCheck,
        responseTime: info.responseTime,
        serviceName,
        status: info.status,
      }),
    );

    let status = 'ok';

    if (checks.length > 0) {
      if (checks.some((c) => c.status === 'down')) {
        status = 'down';
      } else if (checks.some((c) => c.status === 'degraded')) {
        status = 'degraded';
      } else {
        status = 'ok';
      }
    }

    return { checks, status };
  }

  /**
   * Get paginated list of system health check records.
   */
  async listChecks(request: SystemHealthChecksListRequest): Promise<SystemHealthChecksListResponse> {
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(systemHealthChecks)
        .orderBy(desc(systemHealthChecks.checkedAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(systemHealthChecks),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }
}
