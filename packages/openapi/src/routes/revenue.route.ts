import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { RevenueController } from '../controllers/revenue.controller';
import { requireAuth } from '../middleware/auth';
import { RevenueDateRangeQuerySchema } from '../types/revenue.type';

const RevenueRoutes = new Hono();

/**
 * Get revenue dashboard stats
 * GET /api/v1/revenue/dashboard-stats?startDate=&endDate=
 */
RevenueRoutes.get(
  '/dashboard-stats',
  requireAuth,
  zValidator('query', RevenueDateRangeQuerySchema),
  async (c) => {
    const revenueController = new RevenueController();
    return await revenueController.getDashboardStats(c);
  },
);

/**
 * Get subscription analytics
 * GET /api/v1/revenue/subscription-analytics
 */
RevenueRoutes.get('/subscription-analytics', requireAuth, async (c) => {
  const revenueController = new RevenueController();
  return await revenueController.getSubscriptionAnalytics(c);
});

/**
 * Get credit analytics
 * GET /api/v1/revenue/credit-analytics
 */
RevenueRoutes.get('/credit-analytics', requireAuth, async (c) => {
  const revenueController = new RevenueController();
  return await revenueController.getCreditAnalytics(c);
});

/**
 * Get spend stats
 * GET /api/v1/revenue/spend-stats?startDate=&endDate=
 */
RevenueRoutes.get(
  '/spend-stats',
  requireAuth,
  zValidator('query', RevenueDateRangeQuerySchema),
  async (c) => {
    const revenueController = new RevenueController();
    return await revenueController.getSpendStats(c);
  },
);

export default RevenueRoutes;
