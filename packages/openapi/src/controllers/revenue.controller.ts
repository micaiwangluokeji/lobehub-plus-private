import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { RevenueService } from '../services/revenue.service';
import type { RevenueDateRangeQuery } from '../types/revenue.type';

/**
 * Revenue controller class
 * Handles revenue analytics HTTP requests and responses
 */
export class RevenueController extends BaseController {
  /**
   * Get dashboard stats
   * GET /api/v1/revenue/dashboard-stats
   */
  async getDashboardStats(c: Context): Promise<Response> {
    try {
      const { startDate, endDate } = this.getQuery<RevenueDateRangeQuery>(c);

      const db = await this.getDatabase();
      const revenueService = new RevenueService(db);
      const stats = await revenueService.getDashboardStats({ endDate, startDate });

      return this.success(c, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get subscription analytics
   * GET /api/v1/revenue/subscription-analytics
   */
  async getSubscriptionAnalytics(c: Context): Promise<Response> {
    try {
      const db = await this.getDatabase();
      const revenueService = new RevenueService(db);
      const analytics = await revenueService.getSubscriptionAnalytics();

      return this.success(c, analytics, 'Subscription analytics retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get credit analytics
   * GET /api/v1/revenue/credit-analytics
   */
  async getCreditAnalytics(c: Context): Promise<Response> {
    try {
      const db = await this.getDatabase();
      const revenueService = new RevenueService(db);
      const analytics = await revenueService.getCreditAnalytics();

      return this.success(c, analytics, 'Credit analytics retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  /**
   * Get spend stats
   * GET /api/v1/revenue/spend-stats
   */
  async getSpendStats(c: Context): Promise<Response> {
    try {
      const { startDate, endDate } = this.getQuery<RevenueDateRangeQuery>(c);

      const db = await this.getDatabase();
      const revenueService = new RevenueService(db);
      const stats = await revenueService.getSpendStats({ endDate, startDate });

      return this.success(c, stats, 'Spend stats retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
