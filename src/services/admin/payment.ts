'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface PaymentConfigWechat {
  enabled: boolean;
  appId?: string;
  mchId?: string;
  apiKey?: string;
  apiCert?: string;
}

export interface PaymentConfigAlipay {
  enabled: boolean;
  appId?: string;
  privateKey?: string;
  publicKey?: string;
  gateway?: 'production' | 'sandbox';
}

// UI-facing type (general is nested for antd Form name paths)
export interface PaymentConfig {
  wechat: PaymentConfigWechat;
  alipay: PaymentConfigAlipay;
  general: {
    currency: string;
    paymentTimeout: number;
    notifyUrl: string;
  };
}

export interface UpdatePaymentConfigParams extends Partial<PaymentConfig> {}

// Transform backend flat format → UI nested format
const toUIConfig = (backend: {
  wechat: PaymentConfigWechat | null;
  alipay: PaymentConfigAlipay | null;
  currency: string | null;
  paymentTimeout: number | null;
  notifyUrl: string | null;
}): PaymentConfig => ({
  wechat: {
    enabled: backend.wechat?.enabled ?? false,
    appId: backend.wechat?.appId ?? '',
    mchId: backend.wechat?.mchId ?? '',
    apiKey: backend.wechat?.apiKey ?? '',
    apiCert: backend.wechat?.apiCert ?? '',
  },
  alipay: {
    enabled: backend.alipay?.enabled ?? false,
    appId: backend.alipay?.appId ?? '',
    privateKey: backend.alipay?.privateKey ?? '',
    publicKey: backend.alipay?.publicKey ?? '',
    gateway: backend.alipay?.gateway ?? 'production',
  },
  general: {
    currency: backend.currency ?? 'CNY',
    paymentTimeout: backend.paymentTimeout ?? 30,
    notifyUrl: backend.notifyUrl ?? '',
  },
});

// Transform UI nested format → backend flat format
const toBackendConfig = (ui: Partial<PaymentConfig>) => ({
  ...(ui.wechat !== undefined && { wechat: ui.wechat }),
  ...(ui.alipay !== undefined && { alipay: ui.alipay }),
  ...(ui.general?.currency !== undefined && { currency: ui.general.currency }),
  ...(ui.general?.paymentTimeout !== undefined && { paymentTimeout: ui.general.paymentTimeout }),
  ...(ui.general?.notifyUrl !== undefined && { notifyUrl: ui.general.notifyUrl }),
});

class AdminPaymentService {
  async getPaymentConfig(): Promise<PaymentConfig> {
    const result = await lambdaClient.payment.getPaymentConfig.query();
    if (!result) {
      return toUIConfig({
        wechat: null,
        alipay: null,
        currency: null,
        paymentTimeout: null,
        notifyUrl: null,
      });
    }
    return toUIConfig(result);
  }

  async updatePaymentConfig(params: UpdatePaymentConfigParams): Promise<{ success: boolean }> {
    await lambdaClient.payment.updatePaymentConfig.mutate(toBackendConfig(params));
    return { success: true };
  }
}

const adminPaymentService = new AdminPaymentService();
export { adminPaymentService };
