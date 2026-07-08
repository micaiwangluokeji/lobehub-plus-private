import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { CreditTransactionService } from '../services/credit-transaction.service';
import type {
  AdjustCreditsRequest,
  CreditTransactionListRequest,
} from '../types/credit-transaction.type';

/**
 * Credit transaction controller class
 * Handles credit transaction related HTTP requests and responses
 */
export class CreditTransactionController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<CreditTransactionListRequest>(c);

      const db = await this.getDatabase();
      const service = new CreditTransactionService(db);
      const result = await service.list(request);

      return this.success(c, result, 'Credit transactions retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const service = new CreditTransactionService(db);
      const result = await service.getById(Number(id));

      if (!result) {
        return this.error(c, 'Credit transaction not found', 404);
      }

      return this.success(c, result, 'Credit transaction retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();

      const db = await this.getDatabase();
      const service = new CreditTransactionService(db);
      const result = await service.create(body);

      return this.success(c, result, 'Credit transaction created successfully', 201);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getUserBalance(c: Context): Promise<Response> {
    try {
      const query = c.req.query();
      const userId = query.userId;

      if (!userId) {
        return this.error(c, 'userId query parameter is required', 400);
      }

      const db = await this.getDatabase();
      const service = new CreditTransactionService(db);
      const balance = await service.getUserBalance(userId);

      return this.success(c, { balance }, 'User balance retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async adjustCredits(c: Context): Promise<Response> {
    try {
      const request = await this.getBody<AdjustCreditsRequest>(c);
      const operatorId = this.getUserId(c);

      if (!operatorId) {
        return this.error(c, 'Authentication required', 401);
      }

      const db = await this.getDatabase();
      const service = new CreditTransactionService(db);
      const result = await service.adjustCredits(request, operatorId);

      return this.success(c, result, 'Credits adjusted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
