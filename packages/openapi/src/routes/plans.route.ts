import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { PlanController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import {
  CreatePlanRequestSchema,
  PlanIdParamSchema,
  PlanListRequestSchema,
  UpdatePlanRequestSchema,
} from '../types/plan.type';

const PlansRoutes = new Hono();

/**
 * Get plan list (supports pagination)
 * GET /api/v1/plans
 */
PlansRoutes.get(
  '/',
  requireAuth,
  zValidator('query', PlanListRequestSchema),
  async (c) => {
    const planController = new PlanController();
    return await planController.list(c);
  },
);

/**
 * Get plan details by ID
 * GET /api/v1/plans/:id
 */
PlansRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', PlanIdParamSchema),
  async (c) => {
    const planController = new PlanController();
    return await planController.getById(c);
  },
);

/**
 * Create a new plan
 * POST /api/v1/plans
 */
PlansRoutes.post(
  '/',
  requireAuth,
  zValidator('json', CreatePlanRequestSchema),
  async (c) => {
    const planController = new PlanController();
    return await planController.create(c);
  },
);

/**
 * Update a plan
 * PATCH /api/v1/plans/:id
 */
PlansRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', PlanIdParamSchema),
  zValidator('json', UpdatePlanRequestSchema),
  async (c) => {
    const planController = new PlanController();
    return await planController.update(c);
  },
);

/**
 * Delete a plan
 * DELETE /api/v1/plans/:id
 */
PlansRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', PlanIdParamSchema),
  async (c) => {
    const planController = new PlanController();
    return await planController.delete(c);
  },
);

export default PlansRoutes;
