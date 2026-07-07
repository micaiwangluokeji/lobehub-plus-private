import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { SpendController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import {
  SpendDailyTrendRequestSchema,
  SpendIdParamSchema,
  SpendListRequestSchema,
  SpendModelCostRequestSchema,
  SpendTopSpendersRequestSchema,
} from '../types/spend.type';

const SpendRoutes = new Hono();

/**
 * Get spend log list (supports filtering and pagination)
 * GET /api/v1/spend
 */
SpendRoutes.get(
  '/',
  requireAuth,
  zValidator('query', SpendListRequestSchema),
  async (c) => {
    const spendController = new SpendController();
    return await spendController.list(c);
  },
);

/**
 * Daily cost trend
 * GET /api/v1/spend/daily-trend?days=30
 */
SpendRoutes.get(
  '/daily-trend',
  requireAuth,
  zValidator('query', SpendDailyTrendRequestSchema),
  async (c) => {
    const spendController = new SpendController();
    return await spendController.getDailyCostTrend(c);
  },
);

/**
 * Cost aggregated by model
 * GET /api/v1/spend/model-cost?startDate=&endDate=
 */
SpendRoutes.get(
  '/model-cost',
  requireAuth,
  zValidator('query', SpendModelCostRequestSchema),
  async (c) => {
    const spendController = new SpendController();
    return await spendController.getModelCost(c);
  },
);

/**
 * Top spenders
 * GET /api/v1/spend/top-spenders?limit=&startDate=&endDate=
 */
SpendRoutes.get(
  '/top-spenders',
  requireAuth,
  zValidator('query', SpendTopSpendersRequestSchema),
  async (c) => {
    const spendController = new SpendController();
    return await spendController.getTopSpenders(c);
  },
);

/**
 * Get spend log details by ID
 * GET /api/v1/spend/:id
 */
SpendRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', SpendIdParamSchema),
  async (c) => {
    const spendController = new SpendController();
    return await spendController.getById(c);
  },
);

export default SpendRoutes;
