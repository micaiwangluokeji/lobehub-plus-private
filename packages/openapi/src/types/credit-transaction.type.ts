import { z } from 'zod';

import type { CreditTransactionItem } from '@/database/schemas';

// ==================== Credit Transaction List Types ====================

export interface CreditTransactionListRequest {
  createdAtAfter?: string;
  createdAtBefore?: string;
  page?: number;
  pageSize?: number;
  type?: string;
  userId?: string;
}

export const CreditTransactionListRequestSchema = z.object({
  createdAtAfter: z.string().optional(),
  createdAtBefore: z.string().optional(),
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
  type: z.string().optional(),
  userId: z.string().optional(),
});

export interface CreditTransactionListResponse {
  data: CreditTransactionItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Credit Adjustment Types ====================

export interface AdjustCreditsRequest {
  amount: number;
  reason?: string;
  userId: string;
}

export const AdjustCreditsRequestSchema = z.object({
  amount: z.number().int().refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z.string().max(500).optional(),
  userId: z.string().min(1, 'User ID cannot be empty'),
});
