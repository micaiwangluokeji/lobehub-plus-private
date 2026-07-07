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

export const topUpRouter = router({
  createOrder: authedDbProcedure
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
      const { planId, amount, credits, description } = input;
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

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

  queryOrder: authedDbProcedure
    .input(queryOrderSchema)
    .query(async ({ input, ctx }) => {
      return ctx.paymentOrdersModel.getById(input.orderId);
    }),

  listMyOrders: authedDbProcedure.query(async ({ ctx }) => {
    return ctx.paymentOrdersModel.listByUser(ctx.userId!);
  }),
});
