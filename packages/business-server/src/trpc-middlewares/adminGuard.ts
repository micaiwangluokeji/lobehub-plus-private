import { authedProcedure } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { withAnyRbacPermission } from './rbacPermission';

/**
 * Procedure base for admin-only routes. Enforces that the caller holds at
 * least one admin-level RBAC permission (super_admin, billing:manage:all,
 * or rbac:role_read:all).
 *
 * Usage:
 *   const myAdminProcedure = adminGuardProcedure.use(...)
 */
export const adminGuardProcedure = authedProcedure
  .use(serverDatabase)
  .use(
    withAnyRbacPermission([
      'billing:manage:all',
      'rbac:role_read:all',
    ]),
  );
