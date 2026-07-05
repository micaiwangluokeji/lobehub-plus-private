import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { RefundRequestsModel } from '@/database/models/refundRequests';

const authedDbProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      refundRequestsModel: new RefundRequestsModel(ctx.serverDB),
    },
  });
});

const createRefundSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

const reviewRefundSchema = z.object({
  id: z.string(),
  approved: z.boolean(),
  reviewNote: z.string().optional(),
});

export const refundRequestRouter = router({
  // Admin: list all refund requests
  list: authedDbProcedure.query(async ({ ctx }) => {
    return ctx.refundRequestsModel.list();
  }),

  // User: list own refund requests
  listMy: authedDbProcedure.query(async ({ ctx }) => {
    return ctx.refundRequestsModel.listByUser(ctx.userId!);
  }),

  // User: create refund request
  create: authedDbProcedure.input(createRefundSchema).mutation(async ({ input, ctx }) => {
    return ctx.refundRequestsModel.create({
      userId: ctx.userId!,
      orderId: input.orderId,
      amount: input.amount,
      reason: input.reason,
      status: 'pending',
    });
  }),

  // Admin: approve or reject refund
  review: authedDbProcedure.input(reviewRefundSchema).mutation(async ({ input, ctx }) => {
    const status = input.approved ? 'approved' : 'rejected';

    // TODO: If approved, trigger WeChat refund API
    // If approved && payment was via WeChat:
    // 1. Call WeChat refund API
    // 2. Update refundRequest with wxRefundId
    // 3. Deduct credits from user's credit_transactions
    // 4. Update payment_order refundStatus/refundAmount

    return ctx.refundRequestsModel.updateStatus(
      input.id,
      status,
      ctx.userId!,
      input.reviewNote,
    );
  }),
});
