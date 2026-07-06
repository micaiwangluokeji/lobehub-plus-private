import { z } from 'zod';

import type { ApiKeyItem } from '@/database/schemas';

// ==================== Api Key List Types ====================

export interface ApiKeyListRequest {
  page?: number;
  pageSize?: number;
  userId?: string;
}

export const ApiKeyListRequestSchema = z.object({
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
  userId: z.string().optional(),
});

export interface ApiKeyListResponse {
  data: ApiKeyItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Api Key Detail ====================

export const ApiKeyIdParamSchema = z.object({
  id: z.string().min(1, 'Api Key ID cannot be empty'),
});

// ==================== Create Api Key ====================

export interface CreateApiKeyRequest {
  enabled?: boolean;
  expiresAt?: string;
  name: string;
  userId: string;
  workspaceId?: string;
}

export const CreateApiKeyRequestSchema = z.object({
  enabled: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  name: z.string().min(1, 'Api Key name cannot be empty').max(256),
  userId: z.string().min(1, 'User ID cannot be empty'),
  workspaceId: z.string().optional(),
});

// ==================== Update Api Key ====================

export interface UpdateApiKeyRequest {
  enabled?: boolean;
  expiresAt?: string | null;
  name?: string;
}

export const UpdateApiKeyRequestSchema = z.object({
  enabled: z.boolean().optional(),
  expiresAt: z.string().datetime().nullish(),
  name: z.string().min(1, 'Api Key name cannot be empty').max(256).optional(),
});
