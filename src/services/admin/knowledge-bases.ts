'use client';

export interface AdminKnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  embeddings: string | null;
  userId: string;
  workspaceId: string | null;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
  embeddings?: string;
}

export interface UpdateKnowledgeBaseParams {
  name?: string;
  description?: string;
  embeddings?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminKnowledgeBaseService extends AdminApiBase {
  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminKnowledgeBase>>('/knowledge-bases', {
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminKnowledgeBase>(`/knowledge-bases/${id}`);
  }

  async create(params: CreateKnowledgeBaseParams) {
    return this.post<AdminKnowledgeBase>('/knowledge-bases', params);
  }

  async update(id: string, params: UpdateKnowledgeBaseParams) {
    return this.patch<AdminKnowledgeBase>(`/knowledge-bases/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/knowledge-bases/${id}`);
  }
}

const adminKnowledgeBaseService = new AdminKnowledgeBaseService();
export { adminKnowledgeBaseService };
