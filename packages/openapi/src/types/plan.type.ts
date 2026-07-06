import { z } from 'zod';

import type { PlanItem } from '@/database/schemas';

// ==================== Plan List Types ====================

export interface PlanListRequest {
  page?: number;
  pageSize?: number;
}

export const PlanListRequestSchema = z.object({
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
});

export interface PlanListResponse {
  data: PlanItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Plan Detail ====================

export const PlanIdParamSchema = z.object({
  id: z.string().min(1, 'Plan ID cannot be empty'),
});

// ==================== Create Plan ====================

export interface CreatePlanRequest {
  billingCycle?: string;
  enabled?: boolean;
  features?: string[];
  monthlyCredits?: number;
  name: string;
  personalBudget?: number;
  price: number;
  sort?: number;
  workspaceBudget?: number;
}

export const CreatePlanRequestSchema = z.object({
  billingCycle: z.string().optional(),
  enabled: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  monthlyCredits: z.number().int().min(0).optional(),
  name: z.string().min(1, 'Plan name cannot be empty'),
  personalBudget: z.number().min(0).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  sort: z.number().int().optional(),
  workspaceBudget: z.number().min(0).optional(),
});

// ==================== Update Plan ====================

export interface UpdatePlanRequest {
  billingCycle?: string;
  enabled?: boolean;
  features?: string[];
  monthlyCredits?: number;
  name?: string;
  personalBudget?: number;
  price?: number;
  sort?: number;
  workspaceBudget?: number;
}

export const UpdatePlanRequestSchema = z.object({
  billingCycle: z.string().optional(),
  enabled: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  monthlyCredits: z.number().int().min(0).optional(),
  name: z.string().min(1, 'Plan name cannot be empty').optional(),
  personalBudget: z.number().min(0).optional(),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  sort: z.number().int().optional(),
  workspaceBudget: z.number().min(0).optional(),
});
