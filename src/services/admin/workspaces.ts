'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface AdminWorkspaceInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar: string | null;
  primaryOwnerId: string;
  settings: Record<string, unknown> | null;
  frozen: boolean;
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'member' | 'viewer';
  joinedAt: string;
}

export interface UpdateWorkspaceParams {
  id: string;
  name?: string;
  description?: string;
  slug?: string;
  frozen?: boolean;
  frozenReason?: string;
}

type WorkspaceClient = typeof lambdaClient.workspace;
type WorkspaceMemberClient = typeof lambdaClient.workspaceMember;

class AdminWorkspaceService {
  async list() {
    return lambdaClient.workspace.list.query();
  }

  async getById(id: string) {
    return lambdaClient.workspace.getById.query({ id });
  }

  async update(input: UpdateWorkspaceParams) {
    return lambdaClient.workspace.update.mutate(input as Parameters<WorkspaceClient['update']['mutate']>[0]);
  }

  async remove(id: string) {
    return lambdaClient.workspace.delete.mutate({ id });
  }

  async listMembers(workspaceId: string) {
    return lambdaClient.workspaceMember.list.query({ workspaceId });
  }
}

const adminWorkspaceService = new AdminWorkspaceService();
export { adminWorkspaceService };
