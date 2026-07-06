import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { PlanService } from '../services';
import type {
  CreatePlanRequest,
  PlanListRequest,
  UpdatePlanRequest,
} from '../types/plan.type';

/**
 * Plan controller class
 * Handles plan-related HTTP requests and responses
 */
export class PlanController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<PlanListRequest>(c);

      const db = await this.getDatabase();
      const planService = new PlanService(db);
      const result = await planService.list(request);

      return this.success(c, result, 'Plan list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const planService = new PlanService(db);
      const result = await planService.getById(id);

      if (!result) {
        return this.error(c, 'Plan not found', 404);
      }

      return this.success(c, result, 'Plan retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const data = await this.getBody<CreatePlanRequest>(c);

      const db = await this.getDatabase();
      const planService = new PlanService(db);
      const result = await planService.create(data);

      return this.success(c, result, 'Plan created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const data = await this.getBody<UpdatePlanRequest>(c);

      const db = await this.getDatabase();
      const planService = new PlanService(db);
      const result = await planService.update(id, data);

      if (!result) {
        return this.error(c, 'Plan not found', 404);
      }

      return this.success(c, result, 'Plan updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const planService = new PlanService(db);
      const result = await planService.delete(id);

      return this.success(c, result, 'Plan deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
