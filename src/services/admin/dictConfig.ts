'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface DictConfigRecord {
  id: string;
  key: string;
  value: unknown;
  label: string;
  group: string;
  type: string;
  sort: number;
  description?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DictConfigParams {
  key: string;
  value: unknown;
  label: string;
  group?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  sort?: number;
  description?: string;
  enabled?: boolean;
}

export interface UpdateDictConfigParams {
  id: string;
  value?: unknown;
  label?: string;
  group?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  sort?: number;
  description?: string;
  enabled?: boolean;
}

class AdminDictConfigService {
  async list(params: { keyword?: string; group?: string; page?: number; pageSize?: number } = {}) {
    const res = (await lambdaClient.dictConfig.list.query(params)) as unknown as {
      items: DictConfigRecord[];
      total: number;
      page: number;
      pageSize: number;
    };
    return {
      data: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
    };
  }

  async getByKey(key: string) {
    return lambdaClient.dictConfig.getByKey.query(key) as Promise<DictConfigRecord>;
  }

  async getByGroup(group: string) {
    return lambdaClient.dictConfig.getByGroup.query(group) as Promise<DictConfigRecord[]>;
  }

  async create(input: DictConfigParams) {
    return lambdaClient.dictConfig.create.mutate(input) as Promise<DictConfigRecord>;
  }

  async update(input: UpdateDictConfigParams) {
    return lambdaClient.dictConfig.update.mutate(input) as Promise<DictConfigRecord>;
  }

  async delete(id: string) {
    return lambdaClient.dictConfig.delete.mutate(id);
  }

  async syncDefaults() {
    return lambdaClient.dictConfig.syncDefaults.mutate();
  }
}

const adminDictConfigService = new AdminDictConfigService();
export { adminDictConfigService };
