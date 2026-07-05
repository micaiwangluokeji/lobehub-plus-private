'use client';

import { lambdaClient } from '@/libs/trpc/client';
import { adminUserService } from '@/services/admin/users';
import { adminAgentService } from '@/services/admin/agents';
import { adminFileService } from '@/services/admin/files';
import { adminMessageService } from '@/services/admin/messages';
import { adminProviderService } from '@/services/admin/providers';
import { adminWorkspaceService } from '@/services/admin/workspaces';

export interface DashboardStats {
  userCount: number;
  workspaceCount: number;
  agentCount: number;
  messageCount: number;
  fileCount: number;
  providerCount: number;
}

class AdminDashboardService {
  async getStats(): Promise<DashboardStats> {
    const [userRes, workspaceRes, agentRes, messageRes, fileRes, providerRes] = await Promise.allSettled([
      adminUserService.list({ page: 1, pageSize: 1 }),
      adminWorkspaceService.list(),
      adminAgentService.list({ page: 1, pageSize: 1 }),
      adminMessageService.list({ page: 1, pageSize: 1 }),
      adminFileService.list({ page: 1, pageSize: 1 }),
      adminProviderService.list({ page: 1, pageSize: 1 }),
    ]);

    const getUserCount = () => {
      if (userRes.status === 'fulfilled') {
        const body = userRes.value as unknown as { data: { total: number } };
        return body.data?.total ?? 0;
      }
      return 0;
    };

    const getWorkspaceCount = () => {
      if (workspaceRes.status === 'fulfilled') {
        const data = workspaceRes.value as unknown as unknown[];
        return Array.isArray(data) ? data.length : 0;
      }
      return 0;
    };

    const getAgentCount = () => {
      if (agentRes.status === 'fulfilled') {
        const body = agentRes.value as unknown as { data: { total: number } };
        return body.data?.total ?? 0;
      }
      return 0;
    };

    const getMessageCount = () => {
      if (messageRes.status === 'fulfilled') {
        const body = messageRes.value as unknown as { data: { total: number } };
        return body.data?.total ?? 0;
      }
      return 0;
    };

    const getFileCount = () => {
      if (fileRes.status === 'fulfilled') {
        const body = fileRes.value as unknown as { data: { total: number } };
        return body.data?.total ?? 0;
      }
      return 0;
    };

    const getProviderCount = () => {
      if (providerRes.status === 'fulfilled') {
        const body = providerRes.value as unknown as { data: { total: number } };
        return body.data?.total ?? 0;
      }
      return 0;
    };

    return {
      agentCount: getAgentCount(),
      fileCount: getFileCount(),
      messageCount: getMessageCount(),
      providerCount: getProviderCount(),
      userCount: getUserCount(),
      workspaceCount: getWorkspaceCount(),
    };
  }

  async getRecentUsers() {
    const res = await adminUserService.list({ page: 1, pageSize: 5 });
    const body = res as unknown as { data: { total: number; users: Array<{ id: string; username: string | null; email: string | null; avatar: string | null; createdAt: string }> } };
    return body.data?.users ?? [];
  }

  async getRecentWorkspaces() {
    const res = await adminWorkspaceService.list();
    const data = res as unknown as Array<{ id: string; name: string; slug: string; createdAt: string; frozen: boolean }>;
    return (data ?? []).slice(0, 5);
  }
}

const adminDashboardService = new AdminDashboardService();
export { adminDashboardService };
