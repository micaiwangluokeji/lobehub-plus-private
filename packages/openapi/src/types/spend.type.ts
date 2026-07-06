import { z } from 'zod';

import type { SpendLogItem } from '@/database/schemas';

// ==================== Spend List Types ====================

export interface SpendListRequest {
  createdAtAfter?: string;
  createdAtBefore?: string;
  modelId?: string;
  page?: number;
  pageSize?: number;
  providerId?: string;
  sessionId?: string;
  status?: string;
  userId?: string;
  workspaceId?: string;
}

export const SpendListRequestSchema = z.object({
  createdAtAfter: z.string().optional(),
  createdAtBefore: z.string().optional(),
  modelId: z.string().optional(),
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
  providerId: z.string().optional(),
  sessionId: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
});

export interface SpendListResponse {
  data: SpendLogItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Spend Detail ====================

export const SpendIdParamSchema = z.object({
  id: z.coerce.number().int().min(1, 'Spend log ID cannot be empty'),
});

// ==================== Daily Cost Trend ====================

export interface SpendDailyTrendRequest {
  days?: number;
}

export const SpendDailyTrendRequestSchema = z.object({
  days: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(365))
    .optional(),
});

// ==================== Model Cost ====================

export interface SpendModelCostRequest {
  endDate?: string;
  startDate?: string;
}

export const SpendModelCostRequestSchema = z.object({
  endDate: z.string().optional(),
  startDate: z.string().optional(),
});

// ==================== Top Spenders ====================

export interface SpendTopSpendersRequest {
  endDate?: string;
  limit?: number;
  startDate?: string;
}

export const SpendTopSpendersRequestSchema = z.object({
  endDate: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  startDate: z.string().optional(),
});

// ==================== Response Item Types ====================

export interface DailyCostTrendItem {
  callCount: number;
  date: string;
  totalCost: number;
  totalTokens: number;
}

export interface ModelCostItem {
  callCount: number;
  modelId: string | null;
  modelName: string | null;
  totalCost: number;
  totalTokens: number;
}

export interface TopSpenderItem {
  callCount: number;
  totalCost: number;
  userId: string;
}
