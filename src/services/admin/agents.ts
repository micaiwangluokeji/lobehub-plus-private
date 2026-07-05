'use client';

export interface AdminAgent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  model: string | null;
  userId: string | null;
  groupId: string | null;
  featured: boolean;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAgentParams {
  title?: string;
  description?: string;
  model?: string;
  systemRole?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminAgentService extends AdminApiBase {
  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminAgent>>('/agents', {
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminAgent>(`/agents/${id}`);
  }

  async update(id: string, params: UpdateAgentParams) {
    return this.patch<AdminAgent>(`/agents/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/agents/${id}`);
  }
}

const adminAgentService = new AdminAgentService();
export { adminAgentService };
