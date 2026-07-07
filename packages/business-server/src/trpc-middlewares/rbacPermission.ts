import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import type { LobeChatDatabase } from '@lobechat/database';
import { users } from '@lobechat/database/schemas';

import { RbacModel } from '@/database/models/rbac';
import { trpc } from '@/libs/trpc/lambda/init';

/**
 * Extended context shape after `serverDatabase` middleware has run.
 *
 * `LambdaContext` (the base trpc context) doesn't include `serverDB` — it is
 * injected dynamically by the `serverDatabase` middleware earlier in the
 * procedure chain. We widen the context via assertion at the call site so the
 * RBAC check can reach the database.
 */
interface PermissionCtx {
  serverDB?: LobeChatDatabase;
  userId?: string | null;
  workspaceId?: string | null;
}

/**
 * Shared permission-check core. Resolves the caller's RBAC grants via
 * `RbacModel` and throws a tRPC error if the gate fails.
 *
 * - `mode: 'any'` → OR semantics: at least one code must be granted.
 * - `mode: 'all'` → AND semantics: every code must be granted.
 *
 * Workspace scope: when `workspaceId` is present (workspace-mode request),
 * both workspace-scoped roles and global roles (`workspace_id IS NULL`, e.g.
 * `super_admin`) are considered. In personal mode (`workspaceId` undefined)
 * every grant is matched, which is correct for the SaaS personal-space flows.
 */
const assertPermission = async (
  ctx: PermissionCtx,
  codes: string[],
  mode: 'all' | 'any',
): Promise<void> => {
  const userId = ctx.userId;
  if (!userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  if (!ctx.serverDB) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database context unavailable for permission check',
    });
  }

  // ★ isRoot 短路：超级管理员直接放行，不走 4 表 JOIN（类似 LifeOS 设计）
  const [userRow] = await ctx.serverDB
    .select({ isRoot: users.isRoot })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRow?.isRoot) return;

  const rbacModel = new RbacModel(ctx.serverDB, userId);
  const workspaceId = ctx.workspaceId ?? undefined;

  const ok =
    mode === 'all'
      ? await rbacModel.hasAllPermissions(codes, { workspaceId })
      : await rbacModel.hasAnyPermission(codes, { workspaceId });

  if (!ok) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Missing required permission: ${codes.join(mode === 'all' ? ' AND ' : ' | ')}`,
    });
  }
};

/**
 * Gate that requires a specific permission code (e.g. `agent:create:all`).
 */
export const withRbacPermission = (code: string) =>
  trpc.middleware(async (opts) => {
    await assertPermission(opts.ctx as PermissionCtx, [code], 'any');
    return opts.next();
  });

/**
 * Gate that requires ANY of the given permission codes (OR logic).
 */
export const withAnyRbacPermission = (codes: string[]) =>
  trpc.middleware(async (opts) => {
    await assertPermission(opts.ctx as PermissionCtx, codes, 'any');
    return opts.next();
  });

/**
 * Gate that requires ALL of the given permission codes (AND logic).
 */
export const withAllRbacPermissions = (codes: string[]) =>
  trpc.middleware(async (opts) => {
    await assertPermission(opts.ctx as PermissionCtx, codes, 'all');
    return opts.next();
  });

/**
 * Sugar for the "member-or-owner" gate — fans the action code out into the
 * `:all | :owner` scope pair so a member with the `:owner` grant passes
 * alongside an owner with the `:all` grant.
 *
 * Example: `withScopedPermission('agent:create')` checks for either
 * `agent:create:all` (owner / super_admin) or `agent:create:owner` (member
 * with create-on-own-resources grant).
 */
export const withScopedPermission = (action: string) =>
  trpc.middleware(async (opts) => {
    await assertPermission(
      opts.ctx as PermissionCtx,
      [`${action}:all`, `${action}:owner`],
      'any',
    );
    return opts.next();
  });
