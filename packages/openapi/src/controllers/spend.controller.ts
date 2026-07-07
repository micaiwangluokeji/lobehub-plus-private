import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { SpendService } from '../services';
import type {
  SpendDailyTrendRequest,
  SpendListRequest,
  SpendModelCostRequest,
  SpendTopSpendersRequest,
} from '../types/spend.type';

/**
 * Spend controller class
 * Handles spend log related HTTP requests and responses
 */
export class SpendController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SpendListRequest>(c);

      const db = await this.getDatabase();
      const spendService = new SpendService(db);
      const result = await spendService.list(request);

      return this.success(c, result, 'Spend list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: number }>(c);

      const db = await this.getDatabase();
      const spendService = new SpendService(db);
      const result = await spendService.getById(id);

      if (!result) {
        return this.error(c, 'Spend log not found', 404);
      }

      return this.success(c, result, 'Spend log retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getDailyCostTrend(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SpendDailyTrendRequest>(c);

      const db = await this.getDatabase();
      const spendService = new SpendService(db);
      const result = await spendService.getDailyCostTrend(request.days);

      return this.success(c, result, 'Daily cost trend retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getModelCost(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SpendModelCostRequest>(c);

      const db = await this.getDatabase();
      const spendService = new SpendService(db);
      const result = await spendService.getModelCost({
        endDate: request.endDate ? new Date(request.endDate) : undefined,
        startDate: request.startDate ? new Date(request.startDate) : undefined,
      });

      return this.success(c, result, 'Model cost retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getTopSpenders(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SpendTopSpendersRequest>(c);

      const db = await this.getDatabase();
      const spendService = new SpendService(db);
      const result = await spendService.getTopSpenders(request.limit, {
        endDate: request.endDate ? new Date(request.endDate) : undefined,
        startDate: request.startDate ? new Date(request.startDate) : undefined,
      });

      return this.success(c, result, 'Top spenders retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
