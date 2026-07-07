import {
  PERMISSION_ACTIONS,
  ROLE_DESCRIPTIONS,
  SYSTEM_DEFAULT_ROLES,
  SYSTEM_ROLE_DISPLAY_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
  type SystemDefaultRoleName,
} from '@lobechat/const/rbac';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { permissions, roles, rolePermissions, userRoles } from '../schemas/rbac';
import type { LobeChatDatabase } from '../type';

const codeToCategory = (code: string): string => code.split(':')[0];

const codeToName = (code: string): string => {
  const base = code.replace(/:(all|owner)$/, '');
  const entry = Object.entries(PERMISSION_ACTIONS).find(([, value]) => value === base);
  if (!entry) return code;
  return entry[0]
    .toLowerCase()
    .split('_')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(' ');
};

const ensurePermissionsExist = async (
  db: LobeChatDatabase,
  codes: string[],
): Promise<Map<string, string>> => {
  const codeList = [...new Set(codes)];

  const existing = await db
    .select({ code: permissions.code, id: permissions.id })
    .from(permissions)
    .where(inArray(permissions.code, codeList));

  const existingCodes = new Set(existing.map((p) => p.code));
  const missing = codeList.filter((code) => !existingCodes.has(code));

  if (missing.length > 0) {
    await db
      .insert(permissions)
      .values(
        missing.map((code) => ({
          category: codeToCategory(code),
          code,
          isActive: true,
          name: codeToName(code),
        })),
      )
      .onConflictDoNothing({ target: permissions.code });
  }

  const all = await db
    .select({ code: permissions.code, id: permissions.id })
    .from(permissions)
    .where(inArray(permissions.code, codeList));

  return new Map(all.map((p) => [p.code, p.id] as const));
};

/**
 * Collect every permission code referenced by the global system roles so we
 * can pass them to `ensurePermissionsExist` in one shot.
 */
const collectSystemPermissionCodes = (): string[] => {
  const codes = new Set<string>();
  for (const list of Object.values(SYSTEM_ROLE_PERMISSIONS)) {
    for (const code of list) codes.add(code);
  }
  return [...codes];
};

/**
 * Create one global system role (e.g. `super_admin`) if it doesn't already
 * exist, then ensure the role-permission links match `SYSTEM_ROLE_PERMISSIONS`.
 * Returns the role id.
 *
 * Global roles have `workspace_id = NULL` and are uniquely identified by
 * `name` alone (the `rbac_roles_name_workspace_unique` index collapses
 * NULL into the `''` bucket). `onConflictDoNothing` makes re-seed idempotent.
 */
const upsertSystemRole = async (
  db: LobeChatDatabase,
  roleName: SystemDefaultRoleName,
  permissionIdByCode: Map<string, string>,
): Promise<string> => {
  const [existing] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, roleName), isNull(roles.workspaceId)))
    .limit(1);

  let roleId: string;
  if (existing) {
    roleId = existing.id;
  } else {
    const [inserted] = await db
      .insert(roles)
      .values({
        description: ROLE_DESCRIPTIONS[roleName],
        displayName: SYSTEM_ROLE_DISPLAY_NAMES[roleName],
        isActive: true,
        isSystem: true,
        name: roleName,
        workspaceId: null,
      })
      .returning({ id: roles.id });
    roleId = inserted.id;
  }

  const targetCodes = SYSTEM_ROLE_PERMISSIONS[roleName];
  const targetIds = targetCodes
    .map((code) => permissionIdByCode.get(code))
    .filter((id): id is string => !!id);

  if (targetIds.length === 0) return roleId;

  // Insert missing links; ON CONFLICT DO NOTHING handles re-seed.
  await db
    .insert(rolePermissions)
    .values(targetIds.map((permissionId) => ({ permissionId, roleId })))
    .onConflictDoNothing();

  return roleId;
};

export interface SeededSystemRoles {
  freeUserRoleId: string;
  proUserRoleId: string;
  superAdminRoleId: string;
  vipUserRoleId: string;
}

/**
 * Idempotently provision the four global system roles (`super_admin`,
 * `pro_user`, `vip_user`, `free_user`) plus all permissions they depend on.
 *
 * `vip_user` is retained for backward compatibility but `pro_user` is the
 * recommended paid-user role going forward.
 *
 * Safe to call:
 * - On system bootstrap (first run after migration)
 * - From an init script to backfill an existing database
 * - Re-run on the same database (no-op after the first run)
 */
export const seedSystemRoles = async (
  db: LobeChatDatabase,
): Promise<SeededSystemRoles> => {
  const permissionIdByCode = await ensurePermissionsExist(
    db,
    collectSystemPermissionCodes(),
  );

  const superAdminRoleId = await upsertSystemRole(
    db,
    SYSTEM_DEFAULT_ROLES.SUPER_ADMIN,
    permissionIdByCode,
  );
  const proUserRoleId = await upsertSystemRole(
    db,
    SYSTEM_DEFAULT_ROLES.PRO_USER,
    permissionIdByCode,
  );
  const vipUserRoleId = await upsertSystemRole(
    db,
    SYSTEM_DEFAULT_ROLES.VIP_USER,
    permissionIdByCode,
  );
  const freeUserRoleId = await upsertSystemRole(
    db,
    SYSTEM_DEFAULT_ROLES.FREE_USER,
    permissionIdByCode,
  );

  return { freeUserRoleId, proUserRoleId, superAdminRoleId, vipUserRoleId };
};

/**
 * Grant `userId` a named global system role (`super_admin` | `pro_user` |
 * `vip_user` | `free_user`). Idempotent — re-grants are no-ops thanks to the
 * `(user_id, role_id, workspace_id)` unique index (NULL workspace collapses
 * into the `''` bucket).
 */
export const assignSystemRoleToUser = async (
  db: LobeChatDatabase,
  params: { roleName: SystemDefaultRoleName; userId: string },
): Promise<void> => {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, params.roleName), isNull(roles.workspaceId)))
    .limit(1);

  if (!role) {
    throw new Error(
      `System role ${params.roleName} not found. Call seedSystemRoles first.`,
    );
  }

  await db
    .insert(userRoles)
    .values({ roleId: role.id, userId: params.userId, workspaceId: null })
    .onConflictDoNothing();
};
