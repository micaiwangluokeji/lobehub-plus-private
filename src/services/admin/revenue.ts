import { AdminApiBase } from './base';

export interface SpendStats {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  averageCostPerCall: number;
}

export interface RevenueDashboardStats {
  totalRevenue: number;
  activeSubscriptionsCount: number;
  totalCreditsSold: number;
  totalSpendCost: number;
  totalTokensUsed: number;
}

export interface SubscriptionAnalytics {
  total: number;
  byStatus: { status: string; count: number }[];
  byBillingCycle: { billingCycle: string; count: number }[];
}

export interface CreditAnalytics {
  totalSold: number;
  totalConsumed: number;
  totalRefunded: number;
  byType: { type: string; totalAmount: number; count: number }[];
}

class AdminRevenueService extends AdminApiBase {
  async getDashboardStats(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    return this.get<RevenueDashboardStats>('/revenue/dashboard-stats', {
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
  }

  async getSubscriptionAnalytics() {
    return this.get<SubscriptionAnalytics>('/revenue/subscription-analytics');
  }

  async getCreditAnalytics() {
    return this.get<CreditAnalytics>('/revenue/credit-analytics');
  }

  async getSpendStats(params?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.get<SpendStats>('/revenue/spend-stats', {
      startDate: params?.startDate?.toISOString(),
      endDate: params?.endDate?.toISOString(),
    });
  }
}

export const adminRevenueService = new AdminRevenueService();
