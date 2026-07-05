'use client';

export interface GlobalConfig {
  systemName?: string;
  defaultLanguage?: string;
  registrationEnabled?: boolean;
  [key: string]: unknown;
}

export interface UpdateSystemConfigParams {
  systemName?: string;
  defaultLanguage?: string;
  registrationEnabled?: boolean;
  maxFileUploadSize?: number;
}

import { lambdaClient } from '@/libs/trpc/client';

class AdminSettingsService {
  async getGlobalConfig() {
    return lambdaClient.config.getGlobalConfig.query();
  }

  async getDefaultAgentConfig() {
    return lambdaClient.config.getDefaultAgentConfig.query();
  }

  async updateNavVisibility(input: Record<string, boolean>) {
    return lambdaClient.config.updateNavVisibility.mutate(input);
  }

  async updateSystemConfig(input: UpdateSystemConfigParams) {
    return lambdaClient.config.updateSystemConfig.mutate(input);
  }
}

const adminSettingsService = new AdminSettingsService();
export { adminSettingsService };
