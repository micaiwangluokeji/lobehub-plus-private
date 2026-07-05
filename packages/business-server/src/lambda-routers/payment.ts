import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { PaymentPlansModel } from '@/database/models/paymentPlans';

const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      paymentPlansModel: new PaymentPlansModel(ctx.serverDB),
    },
  });
});

const wechatSchema = z.object({
  enabled: z.boolean(),
  appId: z.string().optional(),
  mchId: z.string().optional(),
  apiKey: z.string().optional(),
  apiCert: z.string().optional(),
});

const alipaySchema = z.object({
  enabled: z.boolean(),
  appId: z.string().optional(),
  privateKey: z.string().optional(),
  publicKey: z.string().optional(),
  gateway: z.enum(['production', 'sandbox']).optional(),
});

const updatePaymentConfigSchema = z.object({
  wechat: wechatSchema.optional(),
  alipay: alipaySchema.optional(),
  currency: z.string().length(3).optional(),
  paymentTimeout: z.number().min(1).max(1440).optional(),
  notifyUrl: z.string().max(512).optional(),
});

export const paymentRouter = router({
  getPaymentConfig: adminProcedure.query(async ({ ctx }) => {
    return ctx.paymentPlansModel.getPaymentConfig();
  }),

  updatePaymentConfig: adminProcedure
    .input(updatePaymentConfigSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.paymentPlansModel.updatePaymentConfig(input);
    }),
});
