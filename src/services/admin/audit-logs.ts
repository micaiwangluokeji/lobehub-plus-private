'use client';

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

import { lambdaClient } from '@/libs/trpc/client';

class AdminAuditLogService {
  async list(params: { keyword?: string; action?: string; resourceType?: string; limit?: number; offset?: number }) {
    return lambdaClient.workspaceAuditLog.adminList.query({
      keyword: params.keyword,
      action: params.action,
      resourceType: params.resourceType,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    }) as unknown as { data: AuditLog[]; total: number };
  }

  async getById(id: string) {
    return lambdaClient.workspaceAuditLog.getById.query({ id }) as unknown as AuditLog;
  }
}

const adminAuditLogService = new AdminAuditLogService();
export { adminAuditLogService };
