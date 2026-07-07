import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { paymentOrders } from '@/database/schemas/paymentOrders';
import { creditTransactions, spendLogs, subscriptions } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  CreditAnalytics,
  RevenueDashboardStats,
  SpendStats,
  SubscriptionAnalytics,
} from '../types/revenue.type';

/**
 * Revenue service — admin-level aggregate queries across subscriptions,
 * payment orders, credit transactions and spend logs.
 *
 * Does not extend BaseService: queries are cross-user (admin scope) and
 * do not need per-user permission filtering.
 */
export class RevenueService {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  /**
   * Dashboard overview stats.
   * - active subscriptions count
   * - total revenue (sum of paid payment orders amount)
   * - total credits sold (sum of purchase credit transactions amount)
   * - total spend cost & tokens (sum of spend logs)
   */
  async getDashboardStats(params?: {
    endDate?: Date;
    startDate?: Date;
  }): Promise<RevenueDashboardStats> {
    const paymentConditions = [eq(paymentOrders.status, 'paid')];
    const creditConditions = [eq(creditTransactions.type, 'top_up')];
    const spendConditions = [];

    if (params?.startDate) {
      paymentConditions.push(gte(paymentOrders.paidAt, params.startDate));
      creditConditions.push(gte(creditTransactions.createdAt, params.startDate));
      spendConditions.push(gte(spendLogs.createdAt, params.startDate));
    }

    if (params?.endDate) {
      paymentConditions.push(lte(paymentOrders.paidAt, params.endDate));
      creditConditions.push(lte(creditTransactions.createdAt, params.endDate));
      spendConditions.push(lte(spendLogs.createdAt, params.endDate));
    }

    const [activeSubsResult, revenueResult, creditsResult, spendResult] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active')),

      this.db
        .select({ total: sql<number>`coalesce(sum(${paymentOrders.amount}), 0)` })
        .from(paymentOrders)
        .where(and(...paymentConditions)),

      this.db
        .select({ total: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)` })
        .from(creditTransactions)
        .where(and(...creditConditions)),

      this.db
        .select({
          totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
          totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
        })
        .from(spendLogs)
        .where(and(...spendConditions)),
    ]);

    return {
      activeSubscriptionsCount: Number(activeSubsResult[0]?.count || 0),
      totalCreditsSold: Number(creditsResult[0]?.total || 0),
      totalRevenue: Number(revenueResult[0]?.total || 0),
      totalSpendCost: Number(spendResult[0]?.totalCost || 0),
      totalTokensUsed: Number(spendResult[0]?.totalTokens || 0),
    };
  }

  /**
   * Subscription analytics: total count, grouped by status and billing cycle.
   */
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    const [totalResult, byStatusResult, byBillingCycleResult] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions),

      this.db
        .select({
          count: sql<number>`count(*)`,
          status: subscriptions.status,
        })
        .from(subscriptions)
        .groupBy(subscriptions.status),

      this.db
        .select({
          billingCycle: subscriptions.billingCycle,
          count: sql<number>`count(*)`,
        })
        .from(subscriptions)
        .groupBy(subscriptions.billingCycle),
    ]);

    return {
      byBillingCycle: byBillingCycleResult.map((r) => ({
        billingCycle: r.billingCycle,
        count: Number(r.count),
      })),
      byStatus: byStatusResult.map((r) => ({
        count: Number(r.count),
        status: r.status,
      })),
      total: Number(totalResult[0]?.count || 0),
    };
  }

  /**
   * Credit analytics: total sold / consumed / refunded, grouped by type.
   */
  async getCreditAnalytics(): Promise<CreditAnalytics> {
    const [byTypeResult] = await Promise.all([
      this.db
        .select({
          count: sql<number>`count(*)`,
          totalAmount: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`,
          type: creditTransactions.type,
        })
        .from(creditTransactions)
        .groupBy(creditTransactions.type),
    ]);

    const totals = {
      totalConsumed: 0,
      totalRefunded: 0,
      totalSold: 0,
    };

    for (const row of byTypeResult) {
      const amount = Number(row.totalAmount);
      if (row.type === 'purchase') {
        totals.totalSold += amount;
      } else if (row.type === 'consumption') {
        totals.totalConsumed += Math.abs(amount);
      } else if (row.type === 'refund') {
        totals.totalRefunded += amount;
      }
    }

    return {
      byType: byTypeResult.map((r) => ({
        count: Number(r.count),
        totalAmount: Number(r.totalAmount),
        type: r.type,
      })),
      ...totals,
    };
  }

  /**
   * Spend stats: total cost, total tokens, total calls, average cost per call.
   */
  async getSpendStats(params?: { endDate?: Date; startDate?: Date }): Promise<SpendStats> {
    const conditions = [];

    if (params?.startDate) {
      conditions.push(gte(spendLogs.createdAt, params.startDate));
    }

    if (params?.endDate) {
      conditions.push(lte(spendLogs.createdAt, params.endDate));
    }

    const result = await this.db
      .select({
        totalCalls: sql<number>`count(*)`,
        totalCost: sql<number>`coalesce(sum(${spendLogs.totalCost}), 0)`,
        totalTokens: sql<number>`coalesce(sum(${spendLogs.totalTokens}), 0)`,
      })
      .from(spendLogs)
      .where(and(...conditions));

    const totalCalls = Number(result[0]?.totalCalls || 0);
    const totalCost = Number(result[0]?.totalCost || 0);
    const totalTokens = Number(result[0]?.totalTokens || 0);

    return {
      averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      totalCalls,
      totalCost,
      totalTokens,
    };
  }
}
