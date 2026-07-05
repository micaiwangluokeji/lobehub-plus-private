import { lambdaClient } from '@/libs/trpc/lambda/client';

export const creditService = {
  getMyBalance: () => lambdaClient.creditTransaction.getMyBalance.query(),
  listMyHistory: (page = 1, pageSize = 20) =>
    lambdaClient.creditTransaction.listMyHistory.query({ page, pageSize }),
};

export const planService = {
  listPublicPlans: () => lambdaClient.plan.listPublicPlans.query(),
  getPublicCreditConfig: () => lambdaClient.plan.getPublicCreditConfig.query(),
};

export const membershipService = {
  listEnabled: () => lambdaClient.membershipLevel.listEnabled.query(),
};

export const referralService = {
  generateInviteCode: () => lambdaClient.referral.generateInviteCode.mutate(),
  getMyReferrals: () => lambdaClient.referral.getMyReferrals.query(),
  getReferralStats: () => lambdaClient.referral.getReferralStats.query(),
};

export const topUpService = {
  createOrder: (params: { planId?: string; amount: number; credits: number; description?: string }) =>
    lambdaClient.topUp.createOrder.mutate(params),
  queryOrder: (orderId: string) => lambdaClient.topUp.queryOrder.query({ orderId }),
  listMyOrders: () => lambdaClient.topUp.listMyOrders.query(),
};

export const subscriptionService = {
  getActiveSubscription: () => lambdaClient.subscription.getActiveSubscription.query(),
};
