import { eq } from 'drizzle-orm';

import { router } from '@/libs/trpc/lambda';
import {
  RBAC_PERMISSIONS,
  SYSTEM_DEFAULT_ROLES,
  SYSTEM_ROLE_PERMISSIONS,
} from '@lobechat/const/rbac';
import { permissions, rolePermissions, roles } from '@/database/schemas/rbac';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => opts.next());

export const rbacSyncRouter = router({
  syncPermissions: adminProcedure.mutation(async ({ ctx }) => {
    const db = ctx.serverDB;
    const results: string[] = [];

    // 1. Collect all codes from const
    const allCodes = [...new Set(Object.values(RBAC_PERMISSIONS))];
    results.push(`const/rbac.ts: ${allCodes.length} codes`);

    // 2. DB existing
    const dbPerms = await db!
      .select({ code: permissions.code, id: permissions.id })
      .from(permissions);
    const dbCodes = new Set(dbPerms.map((p) => p.code));

    // New codes
    const newCodes = allCodes.filter((c) => !dbCodes.has(c));
    if (newCodes.length > 0) {
      // Assign category based on resource prefix
      const categoryMap: Record<string, string> = {
        agent: 'agent',
        ai_model: 'ai',
        ai_provider: 'ai',
        api_key: 'api',
        document: 'content',
        file: 'content',
        knowledge_base: 'content',
        message: 'chat',
        session: 'chat',
        session_group: 'chat',
        topic: 'chat',
        translation: 'content',
        user: 'user',
        rbac: 'system',
        workspace: 'workspace',
        workspace_member: 'workspace',
        workspace_audit: 'workspace',
        workspace_role: 'workspace',
        group: 'group',
        billing: 'billing',
        credit: 'billing',
        subscription: 'billing',
        referral: 'billing',
      };
      for (const code of newCodes) {
        const prefix = code.split(':')[0];
        const cat = categoryMap[prefix] || 'other';
        await db!
          .insert(permissions)
          .values({
            id: crypto.randomUUID?.() || `perm-${code}`,
            code,
            name: code,
            category: cat,
            isActive: true,
          })
          .onConflictDoNothing()
          .catch(() => {});
      }
      results.push(`new: ${newCodes.length} (${newCodes.join(', ')})`);
    } else {
      results.push('new: 0 (all synced)');
    }

    // 3. Re-assign super_admin
    const sa = await db!
      .select()
      .from(roles)
      .where(eq(roles.name, SYSTEM_DEFAULT_ROLES.SUPER_ADMIN))
      .limit(1);
    if (sa.length) {
      const activePerms = await db!
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.isActive, true));
      let added = 0;
      for (const p of activePerms) {
        await db!
          .insert(rolePermissions)
          .values({ roleId: sa[0].id, permissionId: p.id })
          .onConflictDoNothing()
          .catch(() => {});
        added++;
      }
      results.push(`super_admin: ${activePerms.length} perms`);
    }

    // 4. Sync other system roles
    for (const [roleName, rolePerms] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
      if (roleName === SYSTEM_DEFAULT_ROLES.SUPER_ADMIN) continue;
      const r = await db!.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      if (!r.length) continue;
      let added = 0;
      for (const code of rolePerms as string[]) {
        const p = dbPerms.find((x) => x.code === code);
        if (p) {
          await db!
            .insert(rolePermissions)
            .values({ roleId: r[0].id, permissionId: p.id })
            .onConflictDoNothing()
            .catch(() => {});
          added++;
        }
      }
      results.push(`${roleName}: ${rolePerms.length} defined, ${added} assigned`);
    }

    return { success: true, results };
  }),
});
