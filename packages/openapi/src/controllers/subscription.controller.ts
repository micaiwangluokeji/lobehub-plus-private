import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { SubscriptionService } from '../services';
import type {
  CancelSubscriptionRequest,
  CreateSubscriptionRequest,
  RenewSubscriptionRequest,
  SubscriptionListRequest,
  UpdateSubscriptionRequest,
} from '../types/subscription.type';

/**
 * Subscription controller class
 * Handles subscription-related HTTP requests and responses
 */
export class SubscriptionController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<SubscriptionListRequest>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.list(request);

      return this.success(c, result, 'Subscription list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.getById(id);

      if (!result) {
        return this.error(c, 'Subscription not found', 404);
      }

      return this.success(c, result, 'Subscription retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const data = await this.getBody<CreateSubscriptionRequest>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.create(data);

      return this.success(c, result, 'Subscription created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const data = await this.getBody<UpdateSubscriptionRequest>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.update(id, data);

      if (!result) {
        return this.error(c, 'Subscription not found', 404);
      }

      return this.success(c, result, 'Subscription updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.delete(id);

      return this.success(c, result, 'Subscription deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async cancelSubscription(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const body = await this.getBody<CancelSubscriptionRequest>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.cancelSubscription(id, body?.reason);

      if (!result) {
        return this.error(c, 'Subscription not found', 404);
      }

      return this.success(c, result, 'Subscription canceled successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async renewSubscription(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const body = await this.getBody<RenewSubscriptionRequest>(c);

      const db = await this.getDatabase();
      const subscriptionService = new SubscriptionService(db);
      const result = await subscriptionService.renewSubscription(id, body.newPeriodEnd);

      if (!result) {
        return this.error(c, 'Subscription not found', 404);
      }

      return this.success(c, result, 'Subscription renewed successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
