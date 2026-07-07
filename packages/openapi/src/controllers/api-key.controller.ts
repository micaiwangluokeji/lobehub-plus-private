import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { ApiKeyService } from '../services';
import type {
  ApiKeyListRequest,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/api-key.type';

/**
 * Api Key controller class
 * Handles api key related HTTP requests and responses
 */
export class ApiKeyController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<ApiKeyListRequest>(c);

      const db = await this.getDatabase();
      const apiKeyService = new ApiKeyService(db);
      const result = await apiKeyService.list(request);

      return this.success(c, result, 'Api Key list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const apiKeyService = new ApiKeyService(db);
      const result = await apiKeyService.getById(id);

      if (!result) {
        return this.error(c, 'Api Key not found', 404);
      }

      return this.success(c, result, 'Api Key retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const request = await this.getBody<CreateApiKeyRequest>(c);

      const db = await this.getDatabase();
      const apiKeyService = new ApiKeyService(db);
      const result = await apiKeyService.create(request);

      return this.success(c, result, 'Api Key created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const request = await this.getBody<UpdateApiKeyRequest>(c);

      const db = await this.getDatabase();
      const apiKeyService = new ApiKeyService(db);
      const result = await apiKeyService.update(id, request);

      if (!result) {
        return this.error(c, 'Api Key not found', 404);
      }

      return this.success(c, result, 'Api Key updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const apiKeyService = new ApiKeyService(db);
      const result = await apiKeyService.delete(id);

      return this.success(c, result, 'Api Key deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
