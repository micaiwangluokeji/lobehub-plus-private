'use client';

import { AdminApiBase } from './base';

interface RbacRole {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateRoleParams {
  name: string;
  displayName?: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

interface UpdateRoleParams {
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

interface PermissionInfo {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
}

interface RolePermissions {
  role: RbacRole;
  permissions: PermissionInfo[];
}

interface UpdateRolePermissionsParams {
  grant: string[];
  revoke: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminRoleService extends AdminApiBase {
  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<RbacRole>>('/roles', {
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<RbacRole>(`/roles/${id}`);
  }

  async create(params: CreateRoleParams) {
    return this.post<RbacRole>('/roles', params);
  }

  async update(id: string, params: UpdateRoleParams) {
    return this.patch<RbacRole>(`/roles/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/roles/${id}`);
  }

  async getPermissions(id: string) {
    return this.get<RolePermissions>(`/roles/${id}/permissions`);
  }

  async updatePermissions(id: string, params: UpdateRolePermissionsParams) {
    return this.patch<RolePermissions>(`/roles/${id}/permissions`, params);
  }
}

export type { CreateRoleParams, PermissionInfo, RbacRole, RolePermissions, UpdateRoleParams, UpdateRolePermissionsParams };
const adminRoleService = new AdminRoleService();
export { adminRoleService };
