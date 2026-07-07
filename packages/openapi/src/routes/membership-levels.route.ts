import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { MembershipLevelController } from '../controllers/membership-level.controller';
import { requireAuth } from '../middleware/auth';
import {
  CreateMembershipLevelRequestSchema,
  MembershipLevelIdParamSchema,
  MembershipLevelListRequestSchema,
  UpdateMembershipLevelRequestSchema,
} from '../types/membership-level.type';

const MembershipLevelsRoutes = new Hono();

/**
 * Get membership level list
 * GET /api/v1/membership-levels
 */
MembershipLevelsRoutes.get(
  '/',
  requireAuth,
  zValidator('query', MembershipLevelListRequestSchema),
  async (c) => {
    const membershipLevelController = new MembershipLevelController();
    return await membershipLevelController.list(c);
  },
);

/**
 * Create a new membership level
 * POST /api/v1/membership-levels
 */
MembershipLevelsRoutes.post(
  '/',
  requireAuth,
  zValidator('json', CreateMembershipLevelRequestSchema),
  async (c) => {
    const membershipLevelController = new MembershipLevelController();
    return await membershipLevelController.create(c);
  },
);

/**
 * Get membership level details by ID
 * GET /api/v1/membership-levels/:id
 */
MembershipLevelsRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', MembershipLevelIdParamSchema),
  async (c) => {
    const membershipLevelController = new MembershipLevelController();
    return await membershipLevelController.getById(c);
  },
);

/**
 * Update membership level information
 * PATCH /api/v1/membership-levels/:id
 */
MembershipLevelsRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', MembershipLevelIdParamSchema),
  zValidator('json', UpdateMembershipLevelRequestSchema),
  async (c) => {
    const membershipLevelController = new MembershipLevelController();
    return await membershipLevelController.update(c);
  },
);

/**
 * Delete a membership level
 * DELETE /api/v1/membership-levels/:id
 */
MembershipLevelsRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', MembershipLevelIdParamSchema),
  async (c) => {
    const membershipLevelController = new MembershipLevelController();
    return await membershipLevelController.delete(c);
  },
);

export default MembershipLevelsRoutes;
