'use client';

export interface AdminUser {
  id: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  avatar: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserParams {
  email?: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  roleIds?: string[];
}

export interface UpdateUserParams {
  avatar?: string;
  email?: string;
  fullName?: string;
  username?: string;
  isOnboarded?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string | null;
  isSystem: boolean;
  isActive: boolean;
}

export interface UserRoleAssignment {
  id: string;
  name: string;
  displayName: string | null;
  granted: boolean;
}

export interface UpdateUserRolesParams {
  addRoles: string[];
  removeRoles: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

import { AdminApiBase } from './base';

class AdminUserService extends AdminApiBase {
  async list(params: { keyword?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminUser>>('/users', {
      keyword: params.keyword,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminUser>(`/users/${id}`);
  }

  async create(params: CreateUserParams) {
    return this.post<AdminUser>('/users', params);
  }

  async update(id: string, params: UpdateUserParams) {
    return this.patch<AdminUser>(`/users/${id}`, params);
  }

  async remove(id: string) {
    return super.delete(`/users/${id}`);
  }

  async getRoles(id: string) {
    return this.get<UserRole[]>(`/users/${id}/roles`);
  }

  async updateRoles(id: string, params: UpdateUserRolesParams) {
    return this.patch<UserRole[]>(`/users/${id}/roles`, params);
  }

  async clearRoles(id: string) {
    return super.delete(`/users/${id}/roles`);
  }
}

const adminUserService = new AdminUserService();
export { adminUserService };
