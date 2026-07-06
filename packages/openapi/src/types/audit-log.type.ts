import { z } from 'zod';

import type { WorkspaceAuditLogItem } from '@/database/schemas';

// ==================== Audit Log List Types ====================

export interface AuditLogListRequest {
  action?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  resource?: string;
  startDate?: string;
  userId?: string;
}

export const AuditLogListRequestSchema = z.object({
  action: z.string().optional(),
  endDate: z.string().optional(),
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
  resource: z.string().optional(),
  startDate: z.string().optional(),
  userId: z.string().optional(),
});

export interface AuditLogListResponse {
  data: WorkspaceAuditLogItem[];
  page: number;
  pageSize: number;
  total: number;
}
