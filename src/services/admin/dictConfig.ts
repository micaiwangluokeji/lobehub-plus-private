'use client';

import { lambdaClient } from '@/libs/trpc/client';

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
  async list() {
    return lambdaClient.dictConfig.list.query();
  }

  async getByKey(key: string) {
    return lambdaClient.dictConfig.getByKey.query(key);
  }

  async getByGroup(group: string) {
    return lambdaClient.dictConfig.getByGroup.query(group);
  }

  async create(input: DictConfigParams) {
    return lambdaClient.dictConfig.create.mutate(input);
  }

  async update(input: UpdateDictConfigParams) {
    return lambdaClient.dictConfig.update.mutate(input);
  }

  async delete(id: string) {
    return lambdaClient.dictConfig.delete.mutate(id);
  }
}

const adminDictConfigService = new AdminDictConfigService();
export { adminDictConfigService };
