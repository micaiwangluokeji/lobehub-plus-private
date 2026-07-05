'use client';

export interface AdminFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string | null;
  userId: string;
  workspaceId: string | null;
  chunkCount: number | null;
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

class AdminFileService extends AdminApiBase {
  async list(params: { keyword?: string; fileType?: string; page?: number; pageSize?: number }) {
    return this.get<PaginatedResponse<AdminFile>>('/files', {
      keyword: params.keyword,
      fileType: params.fileType,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<AdminFile>(`/files/${id}`);
  }

  async remove(id: string) {
    return super.delete(`/files/${id}`);
  }
}

const adminFileService = new AdminFileService();
export { adminFileService };
