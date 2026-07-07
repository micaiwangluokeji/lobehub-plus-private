import { z } from 'zod';

import type { MembershipLevelItem } from '@/database/schemas/membershipLevels';

export type { MembershipLevelItem };

// ==================== Membership Level List Types ====================

export interface MembershipLevelListRequest {
  page?: number;
  pageSize?: number;
}

export const MembershipLevelListRequestSchema = z.object({
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

export interface MembershipLevelListResponse {
  data: MembershipLevelItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Membership Level CRUD Types ====================

export type CreateMembershipLevelRequest = {
  color?: string;
  enabled?: boolean;
  features?: string[];
  icon?: string;
  level?: number;
  minRechargeTotal?: number;
  monthlyCreditsBonus?: number;
  name: string;
  slug: string;
  sort?: number;
  storageBonusMB?: number;
};

export const CreateMembershipLevelRequestSchema = z.object({
  color: z.string().nullish(),
  enabled: z.boolean().nullish().default(true),
  features: z.array(z.string()).nullish().default([]),
  icon: z.string().nullish(),
  level: z.number().nullish().default(0),
  minRechargeTotal: z.number().nullish().default(0),
  monthlyCreditsBonus: z.number().nullish().default(0),
  name: z.string().min(1, 'Name cannot be empty'),
  slug: z.string().min(1, 'Slug cannot be empty'),
  sort: z.number().nullish().default(0),
  storageBonusMB: z.number().nullish().default(0),
});

export type UpdateMembershipLevelRequest = Partial<CreateMembershipLevelRequest>;

export const UpdateMembershipLevelRequestSchema = CreateMembershipLevelRequestSchema.partial();

// ==================== Common Schemas ====================

export const MembershipLevelIdParamSchema = z.object({
  id: z.string().min(1, 'Invalid membership level ID'),
});
