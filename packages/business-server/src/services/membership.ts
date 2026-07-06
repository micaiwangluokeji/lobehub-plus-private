import type { LobeChatDatabase } from '@lobechat/database';
import { SYSTEM_DEFAULT_ROLES } from '@lobechat/const/rbac';
import { eq, isNull, and } from 'drizzle-orm';

import { SubscriptionsModel } from '@/database/models/subscriptions';
import { MembershipLevelsModel } from '@/database/models/membershipLevels';
import { assignSystemRoleToUser } from '@/database/utils/seedSystemRoles';
import { roles, userRoles } from '@/database/schemas/rbac';

const MEMBERSHIP_ROLES = [SYSTEM_DEFAULT_ROLES.FREE_USER, SYSTEM_DEFAULT_ROLES.PRO_USER, SYSTEM_DEFAULT_ROLES.VIP_USER];

export async function syncMembershipRole(db: LobeChatDatabase, userId: string, levelId: string): Promise<void> {
  const levelsModel = new MembershipLevelsModel(db);
  const level = await levelsModel.getById(levelId);
  if (!level || !level.defaultRole) return;

  const targetRole = level.defaultRole;
  if (!MEMBERSHIP_ROLES.includes(targetRole as (typeof MEMBERSHIP_ROLES)[number])) return;

  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, targetRole)).limit(1);
  if (!role) return;

  const currentSystemRoles = await db
    .select({ roleId: userRoles.roleId, roleName: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.workspaceId)));

  const superAdminRoleId = currentSystemRoles.find((r) => r.roleName === SYSTEM_DEFAULT_ROLES.SUPER_ADMIN)?.roleId;

  const newRoleIds = [superAdminRoleId, role.id].filter(Boolean) as string[];

  await db.delete(userRoles).where(and(eq(userRoles.userId, userId), isNull(userRoles.workspaceId)));

  await db.insert(userRoles).values(newRoleIds.map((rid) => ({ userId, roleId: rid })));
}

export async function upgradeMembershipLevel(db: LobeChatDatabase, userId: string): Promise<{ levelId: string | null; levelName: string | null; shouldUpgrade: boolean }> {
  const levelsModel = new MembershipLevelsModel(db);
  const allLevels = await levelsModel.listEnabled();

  const eligible = allLevels.find((l) => l.level > 0);
  if (!eligible) {
    return { levelId: null, levelName: null, shouldUpgrade: false };
  }

  await syncMembershipRole(db, userId, eligible.id);

  return { levelId: eligible.id, levelName: eligible.name, shouldUpgrade: true };
}

export async function calculateMembershipLevel(
  db: LobeChatDatabase,
  userId: string,
): Promise<{ levelId: string | null; levelName: string | null; shouldUpgrade: boolean }> {
  const levelsModel = new MembershipLevelsModel(db);
  const allLevels = await levelsModel.listEnabled();

  const eligible = allLevels.find((l) => l.level > 0);
  if (!eligible) {
    return { levelId: null, levelName: null, shouldUpgrade: false };
  }

  return { levelId: eligible.id, levelName: eligible.name, shouldUpgrade: true };
}

export async function checkProStatus(
  db: LobeChatDatabase,
  userId: string,
): Promise<boolean> {
  const subsModel = new SubscriptionsModel(db);
  const activeSub = await subsModel.getActiveSubscription(userId);
  return !!activeSub;
}