import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { SystemHealthController } from '../controllers/system-health.controller';
import { requireAuth } from '../middleware/auth';
import { SystemHealthChecksListRequestSchema } from '../types/system-health.type';

const SystemHealthRoutes = new Hono();

/**
 * Get system health dashboard
 * GET /api/v1/system-health/dashboard
 */
SystemHealthRoutes.get('/dashboard', requireAuth, async (c) => {
  const systemHealthController = new SystemHealthController();
  return await systemHealthController.getDashboard(c);
});

/**
 * Get paginated system health check records
 * GET /api/v1/system-health/checks
 */
SystemHealthRoutes.get(
  '/checks',
  requireAuth,
  zValidator('query', SystemHealthChecksListRequestSchema),
  async (c) => {
    const systemHealthController = new SystemHealthController();
    return await systemHealthController.listChecks(c);
  },
);

export default SystemHealthRoutes;
