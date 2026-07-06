import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { AuditLogService } from '../services';
import type { AuditLogListRequest } from '../types/audit-log.type';

/**
 * Audit log controller class
 * Handles audit log related HTTP requests and responses
 */
export class AuditLogController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<AuditLogListRequest>(c);

      const db = await this.getDatabase();
      const auditLogService = new AuditLogService(db);
      const result = await auditLogService.list(request);

      return this.success(c, result, 'Audit log list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
