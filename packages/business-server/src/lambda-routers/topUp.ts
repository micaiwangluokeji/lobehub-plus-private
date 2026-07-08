import { createSign } from 'crypto';
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { PaymentOrdersModel } from '@/database/models/paymentOrders';

const authedDbProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      paymentOrdersModel: new PaymentOrdersModel(ctx.serverDB),
    },
  });
});

const createOrderSchema = z.object({
  planId: z.string().optional(),
  amount: z.number().positive(),
  credits: z.number().int().nonnegative().default(0),
  description: z.string().optional(),
});

const queryOrderSchema = z.object({
  orderId: z.string(),
});

const createPaymentSchema = z.object({
  orderId: z.string(),
  method: z.enum(['wechat', 'alipay']),
});

const signAlipay = (params: Record<string, string>, privateKey: string): string => {
  const sortedKeys = Object.keys(params)
    .filter((k) => params[k] && k !== 'sign')
    .sort();
  const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  return createSign('RSA-SHA256').update(signStr).sign(privateKey, 'base64');
};

export const topUpRouter = router({
  createOrder: authedDbProcedure.input(createOrderSchema).mutation(async ({ input, ctx }) => {
    const { planId, amount, credits, description } = input;
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);

    return ctx.paymentOrdersModel.create({
      userId: ctx.userId!,
      planId: planId || null,
      amount,
      credits,
      description,
      status: 'pending',
      expiredAt,
    });
  }),

  createPayment: authedDbProcedure.input(createPaymentSchema).mutation(async ({ input, ctx }) => {
    const { orderId, method } = input;
    const order = await ctx.paymentOrdersModel.getById(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.userId !== ctx.userId) {
      throw new Error('无权操作此订单');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态异常');
    }

    const paymentConfig = await ctx.serverDB.query.paymentConfigs.findFirst();

    if (!paymentConfig) {
      throw new Error('支付配置未设置');
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:4010';
    const notifyUrl = paymentConfig.notifyUrl || `${baseUrl}/api/webapi/payment/notify`;
    const returnUrl = `${baseUrl}/settings/payment/success?orderId=${orderId}`;

    if (method === 'wechat') {
      const wechat = paymentConfig.wechat;
      if (!wechat?.enabled) {
        throw new Error('微信支付未启用');
      }
      if (!wechat.appId || !wechat.mchId || !wechat.apiKey || !wechat.apiCert) {
        throw new Error('微信支付配置不完整');
      }

      const { WechatPay } = await import('wechatpay-node-v3');
      const pay = new WechatPay({
        appid: wechat.appId,
        mchid: wechat.mchId,
        publicKey: wechat.apiCert,
        privateKey: wechat.apiCert,
        secret: wechat.apiKey,
      });

      const result = await pay.native({
        description: order.description || '积分充值',
        out_trade_no: order.id,
        notify_url: notifyUrl,
        amount: {
          total: Math.round(order.amount * 100),
          currency: 'CNY',
        },
      });

      return {
        method: 'wechat',
        payVersion: 'V3',
        type: 'native',
        orderId: order.id,
        codeUrl: result.code_url,
        amount: order.amount,
      };
    } else {
      const alipay = paymentConfig.alipay;
      if (!alipay?.enabled) {
        throw new Error('支付宝支付未启用');
      }
      if (!alipay.appId || !alipay.privateKey) {
        throw new Error('支付宝支付配置不完整');
      }

      const gateway =
        alipay.gateway === 'sandbox'
          ? 'https://openapi.alipaydev.com/gateway.do'
          : 'https://openapi.alipay.com/gateway.do';

      const params: Record<string, string> = {
        app_id: alipay.appId,
        method: 'alipay.trade.page.pay',
        charset: 'UTF-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace(/T/, ' ').substring(0, 19),
        version: '1.0',
        biz_content: JSON.stringify({
          out_trade_no: order.id,
          total_amount: order.amount.toString(),
          subject: order.description || '积分充值',
          body: order.description || '积分充值',
          product_code: 'FAST_INSTANT_TRADE_PAY',
          return_url: returnUrl,
          notify_url: notifyUrl,
        }),
      };
      params.sign = signAlipay(params, alipay.privateKey);

      const queryString = Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');

      return {
        method: 'alipay',
        paymentUrl: `${gateway}?${queryString}`,
        orderId: order.id,
      };
    }
  }),

  queryOrder: authedDbProcedure.input(queryOrderSchema).query(async ({ input, ctx }) => {
    return ctx.paymentOrdersModel.getById(input.orderId);
  }),

  listMyOrders: authedDbProcedure.query(async ({ ctx }) => {
    return ctx.paymentOrdersModel.listByUser(ctx.userId!);
  }),
});
