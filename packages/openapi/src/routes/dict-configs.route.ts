import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { DictConfigController } from '../controllers/dict-config.controller';
import { requireAuth } from '../middleware/auth';
import {
  CreateDictConfigRequestSchema,
  DictConfigIdParamSchema,
  DictConfigListRequestSchema,
  UpdateDictConfigRequestSchema,
} from '../types/dict-config.type';

const DictConfigsRoutes = new Hono();

/**
 * Get dict config list (supports filtering and pagination)
 * GET /api/v1/dict-configs
 */
DictConfigsRoutes.get(
  '/',
  requireAuth,
  zValidator('query', DictConfigListRequestSchema),
  async (c) => {
    const dictConfigController = new DictConfigController();
    return await dictConfigController.list(c);
  },
);

/**
 * Create a new dict config
 * POST /api/v1/dict-configs
 */
DictConfigsRoutes.post(
  '/',
  requireAuth,
  zValidator('json', CreateDictConfigRequestSchema),
  async (c) => {
    const dictConfigController = new DictConfigController();
    return await dictConfigController.create(c);
  },
);

/**
 * Get dict config details by ID
 * GET /api/v1/dict-configs/:id
 */
DictConfigsRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', DictConfigIdParamSchema),
  async (c) => {
    const dictConfigController = new DictConfigController();
    return await dictConfigController.getById(c);
  },
);

/**
 * Update dict config information
 * PATCH /api/v1/dict-configs/:id
 */
DictConfigsRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', DictConfigIdParamSchema),
  zValidator('json', UpdateDictConfigRequestSchema),
  async (c) => {
    const dictConfigController = new DictConfigController();
    return await dictConfigController.update(c);
  },
);

/**
 * Delete a dict config
 * DELETE /api/v1/dict-configs/:id
 */
DictConfigsRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', DictConfigIdParamSchema),
  async (c) => {
    const dictConfigController = new DictConfigController();
    return await dictConfigController.delete(c);
  },
);

export default DictConfigsRoutes;
