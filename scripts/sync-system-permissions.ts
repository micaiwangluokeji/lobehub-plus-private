/**
 * Sync system permissions from const/rbac.ts → database.
 * Usage: bun run rbac:sync
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { RBAC_PERMISSIONS, SYSTEM_DEFAULT_ROLES, SYSTEM_ROLE_PERMISSIONS } from '@lobechat/const/rbac';
// Use raw schema imports from source (package doesn't export individual schemas)
import * as rbac from '../packages/database/src/schemas/rbac';

const { permissions, rolePermissions, roles } = rbac;

async function main() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:change_this_password_on_production@127.0.0.1:15432/lobechat';
  console.log('🔌 Connecting to DB...');
  const pg = postgres(url);
  const db = drizzle(pg);

  // 1. All codes from const
  const allCodes = [...new Set(Object.values(RBAC_PERMISSIONS))];
  console.log(`📋 ${allCodes.length} permission codes in const/rbac.ts`);

  // 2. DB codes
  const dbPerms = await db.select({ code: permissions.code, id: permissions.id }).from(permissions);
  const dbCodes = new Set(dbPerms.map(p => p.code));
  const newCodes = allCodes.filter(c => !dbCodes.has(c));
  if (newCodes.length > 0) {
    console.log(`➕ Inserting ${newCodes.length} new permissions...`);
    await db.insert(permissions).values(newCodes.map(c => ({ code: c, name: c, isActive: true }))).onConflictDoNothing();
  }

  // 3. Super admin → all active
  const sa = await db.select().from(roles).where(eq(roles.name, SYSTEM_DEFAULT_ROLES.SUPER_ADMIN)).limit(1);
  if (sa.length) {
    const activePerms = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.isActive, true));
    for (const p of activePerms) {
      await db.insert(rolePermissions).values({ roleId: sa[0].id, permissionId: p.id }).onConflictDoNothing().catch(() => {});
    }
    console.log(`👑 super_admin: ${activePerms.length} permissions`);
  }

  // 4. Sync free_user, pro_user, vip_user
  for (const [roleName, rolePerms] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
    if (roleName === SYSTEM_DEFAULT_ROLES.SUPER_ADMIN) continue;
    const r = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    if (!r.length) { console.log(`⚠️  ${roleName} not found`); continue; }
    let added = 0;
    for (const code of rolePerms as string[]) {
      const p = dbPerms.find(x => x.code === code);
      if (p) {
        await db.insert(rolePermissions).values({ roleId: r[0].id, permissionId: p.id }).onConflictDoNothing().catch(() => {});
        added++;
      }
    }
    console.log(`👤 ${roleName}: ${rolePerms.length} defined, ${added} assigned`);
  }

  console.log('✅ Sync complete.');
  await pg.end();
}

main().catch(e => { console.error(e); process.exit(1); });
