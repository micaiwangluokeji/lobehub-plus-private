'use client';

export interface AdminMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model: string | null;
  tokens: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminMessageService extends AdminApiBase {
  async list(params: { keyword?: string; role?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminMessage>>('/messages', {
      keyword: params.keyword,
      role: params.role,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminMessage>(`/messages/${id}`);
  }

  async remove(id: string) {
    return super.delete(`/messages/${id}`);
  }
}

const adminMessageService = new AdminMessageService();
export { adminMessageService };
