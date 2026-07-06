'use client';

import { lambdaClient } from '@/libs/trpc/client';

export interface CreateMembershipLevelParams {
  name: string;
  slug: string;
  level?: number;
  minRechargeTotal?: number;
  monthlyCreditsBonus?: number;
  storageBonusMB?: number;
  features?: string[];
  icon?: string;
  color?: string;
  enabled?: boolean;
  sort?: number;
  defaultRole?: string;
}

export interface UpdateMembershipLevelParams {
  id: string;
  name?: string;
  slug?: string;
  level?: number;
  minRechargeTotal?: number;
  monthlyCreditsBonus?: number;
  storageBonusMB?: number;
  features?: string[];
  icon?: string;
  color?: string;
  enabled?: boolean;
  sort?: number;
  defaultRole?: string;
}

class AdminMembershipLevelService {
  async list() {
    return lambdaClient.membershipLevel.list.query();
  }

  async create(input: CreateMembershipLevelParams) {
    return lambdaClient.membershipLevel.create.mutate(input);
  }

  async update(input: UpdateMembershipLevelParams) {
    return lambdaClient.membershipLevel.update.mutate(input);
  }

  async delete(id: string) {
    return lambdaClient.membershipLevel.delete.mutate(id);
  }
}

const adminMembershipLevelService = new AdminMembershipLevelService();
export { adminMembershipLevelService };
