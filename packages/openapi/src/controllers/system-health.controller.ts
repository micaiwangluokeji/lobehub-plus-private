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

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const systemHealthService = new SystemHealthService(db);
      const result = await systemHealthService.getCheckById(id);

      if (!result) {
        return this.error(c, 'System health check not found', 404);
      }

      return this.success(c, result, 'System health check retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();

      const db = await this.getDatabase();
      const systemHealthService = new SystemHealthService(db);
      const result = await systemHealthService.createCheck(body);

      return this.success(c, result, 'System health check created successfully', 201);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getServiceStats(c: Context): Promise<Response> {
    try {
      const { serviceName } = this.getParams<{ serviceName: string }>(c);

      const db = await this.getDatabase();
      const systemHealthService = new SystemHealthService(db);
      const result = await systemHealthService.getServiceStats(serviceName);

      return this.success(c, result, 'Service stats retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
