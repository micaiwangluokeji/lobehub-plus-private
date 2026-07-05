/**
 * Initialize global RBAC system roles (`super_admin`, `vip_user`, `free_user`)
 * and their permissions, then grant `super_admin` to the user identified by
 * email `903164524@qq.com`.
 *
 * Usage:
 *   tsx scripts/init-system-roles.ts
 *
 * Requires DATABASE_URL + KEY_VAULTS_SECRET in .env / .env.development.local.
 */
import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { and, count, eq, isNull } from 'drizzle-orm';

const env = process.env.NODE_ENV || 'development';
dotenvExpand.expand(dotenv.config());
dotenvExpand.expand(dotenv.config({ override: true, path: `.env.${env}` }));
dotenvExpand.expand(dotenv.config({ override: true, path: `.env.${env}.local` }));

const ADMIN_EMAIL = '903164524@qq.com';

const main = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Configure .env first.');
    process.exit(1);
  }

  const { serverDB } = await import('../packages/database/src/server');
  const { users } = await import('../packages/database/src/schemas/user');
  const { permissions, rolePermissions, roles, userRoles } = await import(
    '../packages/database/src/schemas/rbac'
  );
  const { seedSystemRoles, assignSystemRoleToUser } = await import(
    '../packages/database/src/utils/seedSystemRoles'
  );
  const { SYSTEM_DEFAULT_ROLES } = await import('@lobechat/const/rbac');

  console.log('🔧 Seeding global system roles and permissions...');
  const seeded = await seedSystemRoles(serverDB);
  console.log('✅ System roles seeded:');
  console.log('   super_admin id =', seeded.superAdminRoleId);
  console.log('   vip_user    id =', seeded.vipUserRoleId);
  console.log('   free_user   id =', seeded.freeUserRoleId);

  // --- Verify roles (workspace_id IS NULL) ---
  const globalRoles = await serverDB
    .select({ id: roles.id, name: roles.name, workspaceId: roles.workspaceId })
    .from(roles)
    .where(isNull(roles.workspaceId));

  console.log('\n📋 Global roles in rbac_roles (workspace_id IS NULL):');
  for (const r of globalRoles) {
    console.log(`   - ${r.name} (id=${r.id})`);
  }

  // --- Verify role-permission counts ---
  const rolePermCounts = await serverDB
    .select({
      count: count(rolePermissions.permissionId),
      name: roles.name,
    })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .where(isNull(roles.workspaceId))
    .groupBy(roles.name);

  console.log('\n🔗 Role-permission counts:');
  for (const row of rolePermCounts) {
    console.log(`   - ${row.name}: ${row.count} permissions`);
  }

  // --- Total permissions in the table ---
  const [permTotal] = await serverDB
    .select({ total: count(permissions.id) })
    .from(permissions);
  console.log(`\n📦 Total permissions in rbac_permissions: ${permTotal.total}`);

  // --- Find the target user and grant super_admin ---
  const [user] = await serverDB
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (!user) {
    console.error(`\n❌ No user found with email: ${ADMIN_EMAIL}`);
    console.error('   Roles were seeded, but the super_admin grant was skipped.');
    process.exit(1);
  }

  console.log(`\n👤 Found user: id=${user.id}, email=${user.email}`);
  await assignSystemRoleToUser(serverDB, {
    roleName: SYSTEM_DEFAULT_ROLES.SUPER_ADMIN,
    userId: user.id,
  });
  console.log(`✅ Granted super_admin to ${ADMIN_EMAIL}`);

  // ★ 同步设置 isRoot 字段（与 LifeOS 的 isRoot 机制保持一致）
  await serverDB
    .update(users)
    .set({ isRoot: true })
    .where(eq(users.id, user.id));
  console.log(`✅ Set isRoot=true for ${ADMIN_EMAIL}`);

  // --- Verify the user-role link ---
  const [grant] = await serverDB
    .select({
      roleName: roles.name,
      userId: userRoles.userId,
      workspaceId: userRoles.workspaceId,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, user.id), eq(roles.name, SYSTEM_DEFAULT_ROLES.SUPER_ADMIN)))
    .limit(1);

  console.log('\n🎟️  User-role verification:');
  console.log('   user_id      =', grant?.userId);
  console.log('   role_name    =', grant?.roleName);
  console.log('   workspace_id =', grant?.workspaceId ?? 'NULL (global)');

  console.log('\n🎉 Initialization complete.');
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Initialization failed:', err);
  process.exit(1);
});
