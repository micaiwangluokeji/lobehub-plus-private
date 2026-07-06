import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { ContentModerationService } from '../services';
import type {
  ContentModerationListRequest,
  UpdateContentModerationRequest,
} from '../types/content-moderation.type';

/**
 * Content moderation controller class
 * Handles content moderation related HTTP requests and responses
 */
export class ContentModerationController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<ContentModerationListRequest>(c);

      const db = await this.getDatabase();
      const contentModerationService = new ContentModerationService(db);
      const result = await contentModerationService.list(request);

      return this.success(c, result, 'Content moderation list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const request = await this.getBody<UpdateContentModerationRequest>(c);

      const db = await this.getDatabase();
      const contentModerationService = new ContentModerationService(db);
      const result = await contentModerationService.update(id, request);

      if (!result) {
        return this.error(c, 'Content moderation log not found', 404);
      }

      return this.success(c, result, 'Content moderation log updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
