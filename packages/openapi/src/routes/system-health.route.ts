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
 * Get system health status (alias for /dashboard, used by frontend)
 * GET /api/v1/system-health/status
 */
SystemHealthRoutes.get('/status', requireAuth, async (c) => {
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

/**
 * Get system health check list (alias for /checks, used by frontend)
 * GET /api/v1/system-health
 */
SystemHealthRoutes.get(
  '/',
  requireAuth,
  zValidator('query', SystemHealthChecksListRequestSchema),
  async (c) => {
    const systemHealthController = new SystemHealthController();
    return await systemHealthController.listChecks(c);
  },
);

/**
 * Get system health check by id
 * GET /api/v1/system-health/:id
 */
SystemHealthRoutes.get('/:id', requireAuth, async (c) => {
  const systemHealthController = new SystemHealthController();
  return await systemHealthController.getById(c);
});

/**
 * Create a system health check
 * POST /api/v1/system-health
 */
SystemHealthRoutes.post('/', requireAuth, async (c) => {
  const systemHealthController = new SystemHealthController();
  return await systemHealthController.create(c);
});

/**
 * Get service stats
 * GET /api/v1/system-health/stats/:serviceName
 */
SystemHealthRoutes.get('/stats/:serviceName', requireAuth, async (c) => {
  const systemHealthController = new SystemHealthController();
  return await systemHealthController.getServiceStats(c);
});

export default SystemHealthRoutes;
