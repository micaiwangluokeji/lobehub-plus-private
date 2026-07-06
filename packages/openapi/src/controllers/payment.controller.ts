import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { PaymentService } from '../services/payment.service';
import type {
  CreateRefundRequest,
  PaymentOrderListRequest,
  UpdatePaymentConfigRequest,
} from '../types/payment.type';

/**
 * Payment controller class
 * Handles payment config / order / refund related HTTP requests and responses
 */
export class PaymentController extends BaseController {
  async listConfigs(c: Context): Promise<Response> {
    try {
      const db = await this.getDatabase();
      const service = new PaymentService(db);
      const result = await service.listConfigs();

      return this.success(c, result, 'Payment configs retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async updateConfig(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const data = await this.getBody<UpdatePaymentConfigRequest>(c);

      const db = await this.getDatabase();
      const service = new PaymentService(db);
      const result = await service.updateConfig(id, data);

      return this.success(c, result, 'Payment config updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async listOrders(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<PaymentOrderListRequest>(c);

      const db = await this.getDatabase();
      const service = new PaymentService(db);
      const result = await service.listOrders(request);

      return this.success(c, result, 'Payment orders retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getOrderById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const service = new PaymentService(db);
      const result = await service.getOrderById(id);

      if (!result) {
        return this.error(c, 'Payment order not found', 404);
      }

      return this.success(c, result, 'Payment order retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async createRefund(c: Context): Promise<Response> {
    try {
      const request = await this.getBody<CreateRefundRequest>(c);
      const reviewerId = this.getUserId(c);

      if (!reviewerId) {
        return this.error(c, 'Authentication required', 401);
      }

      const db = await this.getDatabase();
      const service = new PaymentService(db);
      const result = await service.createRefund(request, reviewerId);

      return this.success(c, result, 'Refund created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
