import { z } from 'zod';

import type { DictConfigItem } from '@/database/schemas/dictConfigs';

export type { DictConfigItem };

// ==================== Dict Config List Types ====================

export interface DictConfigListRequest {
  category?: string;
  key?: string;
  page?: number;
  pageSize?: number;
}

export const DictConfigListRequestSchema = z.object({
  category: z.string().optional(),
  key: z.string().optional(),
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

export interface DictConfigListResponse {
  data: DictConfigItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Dict Config CRUD Types ====================

export type CreateDictConfigRequest = {
  description?: string;
  enabled?: boolean;
  group?: string;
  key: string;
  label: string;
  sort?: number;
  type?: string;
  value: unknown;
};

export const CreateDictConfigRequestSchema = z.object({
  description: z.string().nullish(),
  enabled: z.boolean().nullish().default(true),
  group: z.string().nullish().default('general'),
  key: z.string().min(1, 'Key cannot be empty'),
  label: z.string().min(1, 'Label cannot be empty'),
  sort: z.number().nullish().default(0),
  type: z.string().nullish().default('string'),
  value: z.any(),
});

export type UpdateDictConfigRequest = Partial<CreateDictConfigRequest>;

export const UpdateDictConfigRequestSchema = CreateDictConfigRequestSchema.partial();

// ==================== Common Schemas ====================

export const DictConfigIdParamSchema = z.object({
  id: z.string().min(1, 'Invalid dict config ID'),
});
