'use client';

export interface AdminProvider {
  id: string;
  name: string;
  label: string | null;
  description: string | null;
  enabled: boolean;
  sort: number | null;
  settings: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  keyVaults: Record<string, string> | null;
  logo: string | null;
  source: string | null;
  checkModel: string | null;
  fetchOnClient: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderParams {
  name: string;
  label?: string;
  description?: string;
  enabled?: boolean;
  sort?: number;
  settings?: Record<string, unknown>;
  config?: Record<string, unknown>;
  keyVaults?: Record<string, string>;
  logo?: string;
  source?: string;
  checkModel?: string;
  fetchOnClient?: boolean;
}

export interface UpdateProviderParams {
  label?: string;
  description?: string;
  enabled?: boolean;
  sort?: number;
  settings?: Record<string, unknown>;
  config?: Record<string, unknown>;
  keyVaults?: Record<string, string> | null;
  logo?: string;
  checkModel?: string;
  fetchOnClient?: boolean;
  name?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminProviderService extends AdminApiBase {
  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminProvider>>('/providers', {
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminProvider>(`/providers/${id}`);
  }

  async create(params: CreateProviderParams) {
    return this.post<AdminProvider>('/providers', params);
  }

  async update(id: string, params: UpdateProviderParams) {
    return this.patch<AdminProvider>(`/providers/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/providers/${id}`);
  }
}

const adminProviderService = new AdminProviderService();
export { adminProviderService };
