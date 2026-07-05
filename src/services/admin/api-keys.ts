'use client';

export interface AdminApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  enabled: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyParams {
  name: string;
  expiresAt?: Date | null;
}

export interface UpdateApiKeyParams {
  name?: string;
  enabled?: boolean;
  expiresAt?: Date | null;
}

import { lambdaClient } from '@/libs/trpc/client';

class AdminApiKeyService {
  async list() {
    return lambdaClient.apiKey.getApiKeys.query();
  }

  async create(params: CreateApiKeyParams) {
    return lambdaClient.apiKey.createApiKey.mutate(params);
  }

  async update(id: string, params: UpdateApiKeyParams) {
    return lambdaClient.apiKey.updateApiKey.mutate({
      id,
      value: params,
    });
  }

  async remove(id: string) {
    return lambdaClient.apiKey.deleteApiKey.mutate({ id });
  }
}

const adminApiKeyService = new AdminApiKeyService();
export { adminApiKeyService };
