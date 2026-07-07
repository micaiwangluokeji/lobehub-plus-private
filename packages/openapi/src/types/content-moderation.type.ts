import { z } from 'zod';

import type { ContentModerationLogItem } from '@/database/schemas';

// ==================== Content Moderation List Types ====================

export interface ContentModerationListRequest {
  contentType?: string;
  moderationResult?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
}

export const ContentModerationListRequestSchema = z.object({
  contentType: z.string().optional(),
  moderationResult: z.string().optional(),
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
  status: z.string().optional(),
  userId: z.string().optional(),
});

export interface ContentModerationListResponse {
  data: ContentModerationLogItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== Content Moderation Detail ====================

export const ContentModerationIdParamSchema = z.object({
  id: z.string().uuid('Content moderation log ID must be a valid UUID'),
});

// ==================== Update Content Moderation ====================

export interface UpdateContentModerationRequest {
  moderationResult?: string;
  status?: string;
}

export const UpdateContentModerationRequestSchema = z
  .object({
    moderationResult: z.string().optional(),
    status: z.string().optional(),
  })
  .refine(
    (data) => data.status !== undefined || data.moderationResult !== undefined,
    {
      message: 'At least one of status or moderationResult must be specified',
    },
  );
