'use client';

import { AdminApiBase } from './base';

interface RbacPermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminPermissionService extends AdminApiBase {
  async list(params: {
    keyword?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<RbacPermission>>('/permissions', {
      keyword: params.keyword,
      category: params.category,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<RbacPermission>(`/permissions/${id}`);
  }
}

export type { RbacPermission };
const adminPermissionService = new AdminPermissionService();
export { adminPermissionService };
