import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { SubscriptionsModel } from '@/database/models/subscriptions';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { SpendLogsModel } from '@/database/models/spendLogs';
import { subscriptions } from '@/database/schemas/subscriptions';
import { creditTransactions } from '@/database/schemas/creditTransactions';
import { spendLogs } from '@/database/schemas/spendLogs';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      subscriptionsModel: new SubscriptionsModel(ctx.serverDB),
      creditTransactionsModel: new CreditTransactionsModel(ctx.serverDB),
      spendLogsModel: new SpendLogsModel(ctx.serverDB),
    },
  });
});

// ── Router ────────────────────────────────────────

export const revenueRouter = router({
  // ── Dashboard statistics ─────────────────────────

  getDashboardStats: adminProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const { serverDB } = ctx;

      // 1. Active subscriptions count
      const activeSubscriptionsCount = await ctx.subscriptionsModel.countSubscriptions({
        status: 'active',
      });

      // 2. Total credits sold (top-up amount)
      const totalCreditsSold = await ctx.creditTransactionsModel.sumAmount({
        type: 'top_up',
        startDate: input?.startDate,
        endDate: input?.endDate,
      });

      // 3. Total spend (cost)
      const spendStats = await ctx.spendLogsModel.sumUserCost({
        startDate: input?.startDate,
        endDate: input?.endDate,
      });

      return {
        activeSubscriptionsCount,
        totalCreditsSold,
        totalSpendCost: spendStats.totalCost || 0,
        totalTokensUsed: spendStats.totalTokens || 0,
      };
    }),

  // ── Revenue trends ───────────────────────────────

  getRevenueTrend: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Daily subscription count
      const subscriptionTrend = await ctx.serverDB
        .select({
          date: sql<string>`date(${subscriptions.createdAt})`,
          count: count(),
        })
        .from(subscriptions)
        .where(gte(subscriptions.createdAt, startDate))
        .groupBy(sql`date(${subscriptions.createdAt})`)
        .orderBy(sql`date(${subscriptions.createdAt})`);

      // Daily credit top-up
      const creditTrend = await ctx.serverDB
        .select({
          date: sql<string>`date(${creditTransactions.createdAt})`,
          totalAmount: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.type, 'top_up'),
            gte(creditTransactions.createdAt, startDate),
          ),
        )
        .groupBy(sql`date(${creditTransactions.createdAt})`)
        .orderBy(sql`date(${creditTransactions.createdAt})`);

      return {
        subscriptionTrend,
        creditTrend,
      };
    }),

  // ── Subscription analytics ───────────────────────

  getSubscriptionAnalytics: adminProcedure.query(async ({ ctx }) => {
    const serverDB = ctx.serverDB;

    // Subscriptions by status
    const byStatus = await serverDB
      .select({
        status: subscriptions.status,
        count: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.status);

    // Subscriptions by billing cycle
    const byBillingCycle = await serverDB
      .select({
        billingCycle: subscriptions.billingCycle,
        count: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.billingCycle);

    // Expiring soon
    const expiringSoon = await ctx.subscriptionsModel.getExpiringSubscriptions(7);

    return {
      byStatus,
      byBillingCycle,
      expiringSoonCount: expiringSoon.length,
      expiringSoon,
    };
  }),

  // ── Credit analytics ─────────────────────────────

  getCreditAnalytics: adminProcedure
    .input(z.object({ days: z.number().int().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const { serverDB } = ctx;

      // Credit transactions by type
      const byType = await serverDB
        .select({
          type: creditTransactions.type,
          totalAmount: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)`,
          count: count(),
        })
        .from(creditTransactions)
        .groupBy(creditTransactions.type);

      return {
        byType,
      };
    }),
});
