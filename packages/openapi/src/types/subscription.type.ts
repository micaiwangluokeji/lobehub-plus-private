import { z } from 'zod';

import type { SubscriptionItem } from '@/database/schemas';

// ==================== Subscription List Types ====================

export interface SubscriptionListRequest {
  page?: number;
  pageSize?: number;
  planId?: string;
  status?: string;
  userId?: string;
  workspaceId?: string;
}

export const SubscriptionListRequestSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .optional(),
  pageSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(500))
    .optional(),
  planId: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
});

export interface SubscriptionListResponse {
  data: SubscriptionItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Subscription Detail ====================

export const SubscriptionIdParamSchema = z.object({
  id: z.string().min(1, 'Subscription ID cannot be empty'),
});

// ==================== Create Subscription ====================

export interface CreateSubscriptionRequest {
  billingCycle?: string;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
  planId?: string;
  status?: string;
  userId: string;
  workspaceId?: string;
}

export const CreateSubscriptionRequestSchema = z.object({
  billingCycle: z.string().nullish(),
  currentPeriodEnd: z.string().datetime('currentPeriodEnd must be a valid ISO 8601 datetime'),
  currentPeriodStart: z.string().datetime('currentPeriodStart must be a valid ISO 8601 datetime'),
  paymentProvider: z.string().nullish(),
  paymentSubscriptionId: z.string().nullish(),
  planId: z.string().nullish(),
  status: z.string().nullish(),
  userId: z.string().min(1, 'User ID cannot be empty'),
  workspaceId: z.string().nullish(),
});

// ==================== Update Subscription ====================

export interface UpdateSubscriptionRequest {
  billingCycle?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
  planId?: string;
  status?: string;
  userId?: string;
  workspaceId?: string;
}

export const UpdateSubscriptionRequestSchema = z.object({
  billingCycle: z.string().nullish(),
  currentPeriodEnd: z.string().datetime('currentPeriodEnd must be a valid ISO 8601 datetime').nullish(),
  currentPeriodStart: z
    .string()
    .datetime('currentPeriodStart must be a valid ISO 8601 datetime')
    .nullish(),
  paymentProvider: z.string().nullish(),
  paymentSubscriptionId: z.string().nullish(),
  planId: z.string().nullish(),
  status: z.string().nullish(),
  userId: z.string().nullish(),
  workspaceId: z.string().nullish(),
});

// ==================== Cancel Subscription ====================

export interface CancelSubscriptionRequest {
  reason?: string;
}

export const CancelSubscriptionRequestSchema = z.object({
  reason: z.string().nullish(),
});

// ==================== Renew Subscription ====================

export interface RenewSubscriptionRequest {
  newPeriodEnd: string;
}

export const RenewSubscriptionRequestSchema = z.object({
  newPeriodEnd: z.string().datetime('newPeriodEnd must be a valid ISO 8601 datetime'),
});
