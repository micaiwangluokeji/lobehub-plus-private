import { z } from 'zod';

// ==================== Query Schemas ====================

export const RevenueDateRangeQuerySchema = z.object({
  endDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  startDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export type RevenueDateRangeQuery = z.infer<typeof RevenueDateRangeQuerySchema>;

// ==================== Response Types ====================

export interface RevenueDashboardStats {
  activeSubscriptionsCount: number;
  totalCreditsSold: number;
  totalRevenue: number;
  totalSpendCost: number;
  totalTokensUsed: number;
}

export interface SubscriptionAnalytics {
  byBillingCycle: { billingCycle: string; count: number }[];
  byStatus: { count: number; status: string }[];
  total: number;
}

export interface CreditAnalytics {
  byType: { count: number; totalAmount: number; type: string }[];
  totalConsumed: number;
  totalRefunded: number;
  totalSold: number;
}

export interface SpendStats {
  averageCostPerCall: number;
  totalCalls: number;
  totalCost: number;
  totalTokens: number;
}
