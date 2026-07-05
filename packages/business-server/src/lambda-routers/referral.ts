import crypto from 'crypto';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { InviteCodesModel } from '@/database/models/inviteCodes';
import { CreditTransactionsModel } from '@/database/models/creditTransactions';

const userProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      inviteCodesModel: new InviteCodesModel(ctx.serverDB),
      creditTransactionsModel: new CreditTransactionsModel(ctx.serverDB),
    },
  });
});

export const referralRouter = router({
  generateInviteCode: userProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.inviteCodesModel.findByUser(ctx.userId!);
    const active = existing.find((c) => c.status === 'active');
    if (active) return active;

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    return ctx.inviteCodesModel.create({
      id: crypto.randomUUID(),
      userId: ctx.userId!,
      code,
      status: 'active',
    });
  }),

  getMyReferrals: userProcedure.query(async ({ ctx }) => {
    const referrals = await ctx.inviteCodesModel.listReferrals(ctx.userId!);
    return referrals.filter((r) => r.status === 'used');
  }),

  getReferralStats: userProcedure.query(async ({ ctx }) => {
    const referrals = await ctx.inviteCodesModel.listReferrals(ctx.userId!);
    const used = referrals.filter((r) => r.status === 'used');
    return {
      totalInvited: used.length,
      totalCreditsEarned: used.length, // simplified: 1 referral = 1 reward
    };
  }),
});
