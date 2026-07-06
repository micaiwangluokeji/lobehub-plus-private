import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { ApiKeyController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import {
  ApiKeyIdParamSchema,
  ApiKeyListRequestSchema,
  CreateApiKeyRequestSchema,
  UpdateApiKeyRequestSchema,
} from '../types/api-key.type';

const ApiKeysRoutes = new Hono();

/**
 * Get api key list (supports filtering and pagination)
 * GET /api/v1/api-keys?page=&pageSize=&userId=
 */
ApiKeysRoutes.get(
  '/',
  requireAuth,
  zValidator('query', ApiKeyListRequestSchema),
  async (c) => {
    const apiKeyController = new ApiKeyController();
    return await apiKeyController.list(c);
  },
);

/**
 * Create a new api key
 * POST /api/v1/api-keys
 */
ApiKeysRoutes.post(
  '/',
  requireAuth,
  zValidator('json', CreateApiKeyRequestSchema),
  async (c) => {
    const apiKeyController = new ApiKeyController();
    return await apiKeyController.create(c);
  },
);

/**
 * Get api key details by ID
 * GET /api/v1/api-keys/:id
 */
ApiKeysRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', ApiKeyIdParamSchema),
  async (c) => {
    const apiKeyController = new ApiKeyController();
    return await apiKeyController.getById(c);
  },
);

/**
 * Update api key information
 * PATCH /api/v1/api-keys/:id
 */
ApiKeysRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', ApiKeyIdParamSchema),
  zValidator('json', UpdateApiKeyRequestSchema),
  async (c) => {
    const apiKeyController = new ApiKeyController();
    return await apiKeyController.update(c);
  },
);

/**
 * Delete an api key
 * DELETE /api/v1/api-keys/:id
 */
ApiKeysRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', ApiKeyIdParamSchema),
  async (c) => {
    const apiKeyController = new ApiKeyController();
    return await apiKeyController.delete(c);
  },
);

export default ApiKeysRoutes;
