/* eslint-disable unused-imports/no-unused-vars */
import type { ReferralStatusString } from '@lobechat/types';
import { Plans } from '@lobechat/types';
import type { LobeChatDatabase } from '@lobechat/database';

import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { PaymentPlansModel } from '@/database/models/paymentPlans';
import { InviteCodesModel } from '@/database/models/inviteCodes';
import { SubscriptionsModel } from '@/database/models/subscriptions';

export interface OnUserActivityForBusinessParams {
  currentTime: Date;
  previousLastActiveAt: Date;
  userCreatedAt: Date;
  userId: string;
}

export async function getReferralStatus(userId: string): Promise<ReferralStatusString | undefined> {
  return undefined;
}

export async function getSubscriptionPlan(userId: string): Promise<Plans> {
  return Plans.Free;
}

/**
 * Initialize new user with business logic:
 * 1. Grant default registration credits from credit_configs
 * 2. Process invite code if provided (reward both inviter and invitee)
 */
export async function initNewUserForBusiness(
  userId: string,
  createdAt: Date | null | undefined,
  db?: LobeChatDatabase,
  inviteCode?: string,
): Promise<void> {
  if (!db) return;

  const plansModel = new PaymentPlansModel(db);
  const creditModel = new CreditTransactionsModel(db);
  const config = await plansModel.getCreditConfig();

  // 1. Grant registration bonus
  const bonusCredits = config?.defaultRegistrationCredits || 500;
  if (bonusCredits > 0) {
    await creditModel.create({
      userId,
      type: 'bonus',
      amount: bonusCredits,
      balanceAfter: bonusCredits,
      source: 'registration',
      description: '注册赠送积分',
    });
  }

  // 2. Process invite code
  if (inviteCode) {
    const inviteModel = new InviteCodesModel(db);
    const invite = await inviteModel.findByCode(inviteCode);

    if (invite && invite.status === 'active' && invite.userId !== userId) {
      const rewardCredits = config?.referralRewardCredits || 100;

      // Reward inviter
      const inviterBalance = await creditModel.getUserBalance(invite.userId);
      await creditModel.create({
        userId: invite.userId,
        type: 'bonus',
        amount: rewardCredits,
        balanceAfter: inviterBalance + rewardCredits,
        source: 'referral',
        referenceId: userId,
        description: '邀请奖励',
      });

      // Reward invitee
      const inviteeBalance = await creditModel.getUserBalance(userId);
      await creditModel.create({
        userId,
        type: 'bonus',
        amount: rewardCredits,
        balanceAfter: inviteeBalance + rewardCredits,
        source: 'referral',
        referenceId: invite.userId,
        description: '通过邀请码注册奖励',
      });

      // Mark invite code as used
      await inviteModel.markUsed(inviteCode, userId);
    }
  }
}

export async function onUserActivityForBusiness(
  params: OnUserActivityForBusinessParams,
): Promise<void> {}
