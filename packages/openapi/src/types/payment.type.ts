import { z } from 'zod';

import type { PaymentConfigItem, PaymentOrderItem } from '@/database/schemas';

// ==================== Payment Config Types ====================

export type PaymentConfigResponse = PaymentConfigItem;

export interface UpdatePaymentConfigRequest {
  alipay?: PaymentConfigItem['alipay'];
  currency?: string;
  notifyUrl?: string;
  paymentTimeout?: number;
  wechat?: PaymentConfigItem['wechat'];
}

export const UpdatePaymentConfigRequestSchema = z.object({
  alipay: z
    .object({
      apiKey: z.string().optional(),
      appId: z.string().optional(),
      enabled: z.boolean(),
      gateway: z.enum(['production', 'sandbox']).optional(),
      privateKey: z.string().optional(),
      publicKey: z.string().optional(),
    })
    .nullish(),
  currency: z.string().max(3).nullish(),
  notifyUrl: z.string().max(512).nullish(),
  paymentTimeout: z.number().int().min(1).nullish(),
  wechat: z
    .object({
      apiCert: z.string().optional(),
      apiKey: z.string().optional(),
      appId: z.string().optional(),
      enabled: z.boolean(),
      mchId: z.string().optional(),
    })
    .nullish(),
});

export const PaymentConfigIdParamSchema = z.object({
  id: z.string().min(1, 'Config ID cannot be empty'),
});

// ==================== Payment Order Types ====================

export interface PaymentOrderListRequest {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
}

export const PaymentOrderListRequestSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .optional(),
  pageSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(500))
    .optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
});

export interface PaymentOrderListResponse {
  data: PaymentOrderItem[];
  page: number;
  pageSize: number;
  total: number;
}

export const PaymentOrderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID cannot be empty'),
});

// ==================== Payment Refund Types ====================

export interface CreateRefundRequest {
  amount: number;
  orderId: string;
  reason?: string;
}

export const CreateRefundRequestSchema = z.object({
  amount: z.number().refine((val) => val > 0, 'Refund amount must be greater than zero'),
  orderId: z.string().min(1, 'Order ID cannot be empty'),
  reason: z.string().max(500).optional(),
});
