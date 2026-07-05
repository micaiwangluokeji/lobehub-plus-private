'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface Plan {
  id: string;
  name: string;
  price: number;
  monthlyCredits: number;
  personalBudget?: number;
  workspaceBudget?: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  enabled: boolean;
  sort: number;
}

export interface CreatePlanParams {
  name: string;
  price: number;
  monthlyCredits: number;
  personalBudget?: number;
  workspaceBudget?: number;
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  enabled: boolean;
  sort: number;
}

export interface UpdatePlanParams extends Partial<CreatePlanParams> {
  id: string;
}

export interface CreditConfig {
  pricePerCredit: number;
  minTopUpAmount: number;
  maxTopUpAmount: number;
  bonusRate: number;
  creditExpiryDays: number;
  referralRewardCredits: number;
}

class AdminPlanService {
  async listPlans(): Promise<Plan[]> {
    return (await lambdaClient.plan.listPlans.query()) as unknown as Plan[];
  }

  async createPlan(params: CreatePlanParams): Promise<Plan> {
    return (await lambdaClient.plan.createPlan.mutate(params)) as unknown as Plan;
  }

  async updatePlan(params: UpdatePlanParams): Promise<Plan> {
    const { id, ...data } = params;
    return (await lambdaClient.plan.updatePlan.mutate({ id, data })) as unknown as Plan;
  }

  async deletePlan(id: string): Promise<{ success: boolean }> {
    await lambdaClient.plan.deletePlan.mutate({ id });
    return { success: true };
  }

  async getCreditConfig(): Promise<CreditConfig> {
    const result = await lambdaClient.plan.getCreditConfig.query();
    if (!result) {
      return {
        pricePerCredit: 0.01,
        minTopUpAmount: 1,
        maxTopUpAmount: 9999,
        bonusRate: 0,
        creditExpiryDays: 365,
        referralRewardCredits: 0,
      };
    }
    return result as unknown as CreditConfig;
  }

  async updateCreditConfig(params: Partial<CreditConfig>): Promise<{ success: boolean }> {
    await lambdaClient.plan.updateCreditConfig.mutate(params);
    return { success: true };
  }
}

const adminPlanService = new AdminPlanService();
export { adminPlanService };
