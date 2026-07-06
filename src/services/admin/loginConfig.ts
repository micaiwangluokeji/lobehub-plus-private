'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface LoginConfig {
  allowedLoginMethods: string[];
  allowedRegisterMethods: string[];
  defaultLoginMethod: string;
  allowMultipleLogin: boolean;
  showPolicyAgreement: boolean;
  smsProvider?: string;
  smsApiKey?: string;
  smsSignName?: string;
}

const defaultLoginConfig: LoginConfig = {
  allowedLoginMethods: ['account'],
  allowedRegisterMethods: ['account'],
  defaultLoginMethod: 'account',
  allowMultipleLogin: true,
  showPolicyAgreement: true,
};

class AdminLoginConfigService {
  async getLoginConfig(): Promise<LoginConfig> {
    try {
      const result = await lambdaClient.dictConfig.getByKey.query('login_config');
      if (result && result.value) {
        const parsed = typeof result.value === 'string' ? JSON.parse(result.value) : result.value;
        return { ...defaultLoginConfig, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaultLoginConfig;
  }

  async _findOrCreateRecord() {
    try {
      const existing = await lambdaClient.dictConfig.getByKey.query('login_config');
      if (existing) {
        return { id: existing.id, isNew: false as const };
      }
    } catch {
      // ignore
    }
    // Create new record
    const created = await lambdaClient.dictConfig.create.mutate({
      key: 'login_config',
      value: JSON.stringify(defaultLoginConfig),
      label: '登录配置',
      group: 'auth',
      type: 'json',
    });
    return { id: created.id, isNew: true as const };
  }

  async updateLoginConfig(values: LoginConfig): Promise<void> {
    const { id, isNew } = await this._findOrCreateRecord();
    if (isNew) {
      // Already created with defaults, now update
      await lambdaClient.dictConfig.update.mutate({
        id,
        value: JSON.stringify(values),
      });
    } else {
      await lambdaClient.dictConfig.update.mutate({
        id,
        value: JSON.stringify(values),
      });
    }
  }
}

const adminLoginConfigService = new AdminLoginConfigService();
export { adminLoginConfigService };
