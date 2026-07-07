import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { DictConfigService } from '../services/dict-config.service';
import type {
  CreateDictConfigRequest,
  DictConfigListRequest,
  UpdateDictConfigRequest,
} from '../types/dict-config.type';

/**
 * Dict config controller class
 * Handles dict config related HTTP requests and responses
 */
export class DictConfigController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<DictConfigListRequest>(c);

      const db = await this.getDatabase();
      const dictConfigService = new DictConfigService(db);
      const result = await dictConfigService.list(request);

      return this.success(c, result, 'Dict config list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const dictConfigService = new DictConfigService(db);
      const result = await dictConfigService.getById(id);

      if (!result) {
        return this.error(c, 'Dict config not found', 404);
      }

      return this.success(c, result, 'Dict config retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const body = await this.getBody<CreateDictConfigRequest>(c);

      if (!body) {
        return this.error(c, 'Request body cannot be empty', 400);
      }

      const db = await this.getDatabase();
      const dictConfigService = new DictConfigService(db);
      const result = await dictConfigService.create(body);

      return this.success(c, result, 'Dict config created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const body = await this.getBody<UpdateDictConfigRequest>(c);

      if (!body) {
        return this.error(c, 'Request body cannot be empty', 400);
      }

      const db = await this.getDatabase();
      const dictConfigService = new DictConfigService(db);
      const result = await dictConfigService.update(id, body);

      return this.success(c, result, 'Dict config updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const dictConfigService = new DictConfigService(db);
      const result = await dictConfigService.delete(id);

      return this.success(c, result, 'Dict config deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
