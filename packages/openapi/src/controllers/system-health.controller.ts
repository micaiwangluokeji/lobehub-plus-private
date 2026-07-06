import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { SystemHealthService } from '../services/system-health.service';
import type { SystemHealthChecksListRequest } from '../types/system-health.type';

/**
 * System health controller class
 * Handles system health related HTTP requests and responses
 */
export class SystemHealthController extends BaseController {
  async getDashboard(c: Context): Promise<Response> {
    try {
      const db = await this.getDatabase();
      const systemHealthService = new SystemHealthService(db);
      const result = await systemHealthService.getDashboard();

      return this.success(c, result, 'System health dashboard retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async listChecks(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SystemHealthChecksListRequest>(c);

      const db = await this.getDatabase();
      const systemHealthService = new SystemHealthService(db);
      const result = await systemHealthService.listChecks(request);

      return this.success(c, result, 'System health checks retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
