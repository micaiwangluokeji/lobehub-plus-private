import { z } from 'zod';

import type { SystemHealthCheckItem } from '@/database/schemas/systemHealthChecks';

// ==================== System Health Checks List Types ====================

export interface SystemHealthChecksListRequest {
  page?: number;
  pageSize?: number;
}

export const SystemHealthChecksListRequestSchema = z.object({
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

export interface SystemHealthChecksListResponse {
  data: SystemHealthCheckItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ==================== System Health Dashboard Types ====================

export interface SystemHealthDashboardCheck {
  responseTime?: number;
  serviceName: string;
  status: string;
  lastCheck?: Date;
}

export interface SystemHealthDashboard {
  checks: SystemHealthDashboardCheck[];
  status: string;
}
