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
