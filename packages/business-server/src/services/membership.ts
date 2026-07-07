import type { LobeChatDatabase } from '@lobechat/database';

import { SubscriptionsModel } from '@/database/models/subscriptions';
import { MembershipLevelsModel } from '@/database/models/membershipLevels';

/**
 * Calculate membership level for a user based on their cumulative recharge total.
 * Returns the highest matching level, or null if none.
 */
export async function calculateMembershipLevel(
  db: LobeChatDatabase,
  userId: string,
): Promise<{ levelId: string | null; levelName: string | null; shouldUpgrade: boolean }> {
  const levelsModel = new MembershipLevelsModel(db);
  const allLevels = await levelsModel.listEnabled();

  // Find the highest level where user meets the threshold
  // For now, just return the first enabled level
  // TODO: Calculate from actual cumulative recharge total
  const eligible = allLevels.find((l) => l.level > 0);
  if (!eligible) {
    return { levelId: null, levelName: null, shouldUpgrade: false };
  }

  return { levelId: eligible.id, levelName: eligible.name, shouldUpgrade: true };
}

/**
 * Check if user has an active subscription and should be Pro.
 */
export async function checkProStatus(
  db: LobeChatDatabase,
  userId: string,
): Promise<boolean> {
  const subsModel = new SubscriptionsModel(db);
  const activeSub = await subsModel.getActiveSubscription(userId);
  return !!activeSub;
}
