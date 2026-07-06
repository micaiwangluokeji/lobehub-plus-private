import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { AuditLogController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { AuditLogListRequestSchema } from '../types/audit-log.type';

const AuditLogsRoutes = new Hono();

/**
 * Get audit log list (supports filtering and pagination)
 * GET /api/v1/audit-logs?page=&pageSize=&userId=&action=&resource=&startDate=&endDate=
 */
AuditLogsRoutes.get(
  '/',
  requireAuth,
  zValidator('query', AuditLogListRequestSchema),
  async (c) => {
    const auditLogController = new AuditLogController();
    return await auditLogController.list(c);
  },
);

export default AuditLogsRoutes;
