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

export default ContentModerationRoutes;
