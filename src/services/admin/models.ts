'use client';

export interface AdminModel {
  id: string;
  slug: string;
  displayName: string | null;
  providerId: string;
  enabled: boolean;
  sort: number | null;
  pricing: Record<string, unknown> | null;
  capabilities: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelParams {
  slug: string;
  displayName?: string;
  providerId: string;
  enabled?: boolean;
  sort?: number;
  pricing?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
}

export interface UpdateModelParams {
  displayName?: string;
  enabled?: boolean;
  sort?: number;
  pricing?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminModelService extends AdminApiBase {
  async list(params: { keyword?: string; providerId?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminModel>>('/models', {
      keyword: params.keyword,
      providerId: params.providerId,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminModel>(`/models/${id}`);
  }

  async create(params: CreateModelParams) {
    return this.post<AdminModel>('/models', params);
  }

  async update(id: string, params: UpdateModelParams) {
    return this.patch<AdminModel>(`/models/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/models/${id}`);
  }
}

const adminModelService = new AdminModelService();
export { adminModelService };
