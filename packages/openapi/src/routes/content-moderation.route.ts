import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { ContentModerationController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import {
  ContentModerationIdParamSchema,
  ContentModerationListRequestSchema,
  UpdateContentModerationRequestSchema,
} from '../types/content-moderation.type';

const ContentModerationRoutes = new Hono();

/**
 * Get content moderation log list (supports filtering and pagination)
 * GET /api/v1/content-moderation?page=&pageSize=&userId=&contentType=&moderationResult=&status=
 */
ContentModerationRoutes.get(
  '/',
  requireAuth,
  zValidator('query', ContentModerationListRequestSchema),
  async (c) => {
    const contentModerationController = new ContentModerationController();
    return await contentModerationController.list(c);
  },
);

/**
 * Get content moderation log by id
 * GET /api/v1/content-moderation/:id
 */
ContentModerationRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', ContentModerationIdParamSchema),
  async (c) => {
    const contentModerationController = new ContentModerationController();
    return await contentModerationController.getById(c);
  },
);

/**
 * Create content moderation log
 * POST /api/v1/content-moderation
 */
ContentModerationRoutes.post(
  '/',
  requireAuth,
  zValidator('json', ContentModerationListRequestSchema.partial()),
  async (c) => {
    const contentModerationController = new ContentModerationController();
    return await contentModerationController.create(c);
  },
);

/**
 * Update content moderation log status and moderation result
 * PATCH /api/v1/content-moderation/:id
 */
ContentModerationRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', ContentModerationIdParamSchema),
  zValidator('json', UpdateContentModerationRequestSchema),
  async (c) => {
    const contentModerationController = new ContentModerationController();
    return await contentModerationController.update(c);
  },
);

/**
 * Update content moderation log status (compatible with POST /:id/status)
 * POST /api/v1/content-moderation/:id/status
 */
ContentModerationRoutes.post(
  '/:id/status',
  requireAuth,
  zValidator('param', ContentModerationIdParamSchema),
  zValidator('json', UpdateContentModerationRequestSchema),
  async (c) => {
    const contentModerationController = new ContentModerationController();
    return await contentModerationController.update(c);
  },
);

/**
 * Get content moderation stats
 * GET /api/v1/content-moderation/stats
 */
ContentModerationRoutes.get('/stats', requireAuth, async (c) => {
  const contentModerationController = new ContentModerationController();
  return await contentModerationController.getModerationStats(c);
});

export default ContentModerationRoutes;
