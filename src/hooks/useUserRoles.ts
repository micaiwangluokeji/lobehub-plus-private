'use client';

import { useMemo } from 'react';

import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { userKeys } from '@/libs/swr/keys';
import { rbacService } from '@/services/rbac';
import { authSelectors } from '@/store/user/slices/auth/selectors';
import { useUserStore } from '@/store/user';

export interface UserRoleSummary {
  /** Raw role list from the backend (global + workspace-scoped). */
  roles: string[];
  /** Highest-priority global system role: super_admin > vip_user > free_user. */
  primaryRole: 'super_admin' | 'vip_user' | 'free_user';
  isSuperAdmin: boolean;
  isVip: boolean;
  isFreeUser: boolean;
  isLoading: boolean;
}

const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 3,
  vip_user: 2,
  free_user: 1,
};

/**
 * Fetch the current user's RBAC roles and derive a primary role for UI display.
 *
 * The `primaryRole` is the highest-priority global system role the user holds.
 * Workspace-scoped roles (e.g. `workspace_owner`) are excluded from primary
 * derivation since they don't determine global capabilities on the personal
 * mode UI.
 */
export const useUserRoles = (): UserRoleSummary => {
  const isLogin = useUserStore(authSelectors.isLogin);
  const { data, isLoading } = useOnlyFetchOnceSWR(
    isLogin ? userKeys.roles() : null,
    () => rbacService.getUserRoles(),
  );

  return useMemo(() => {
    const roleNames = (data ?? [])
      .filter((r) => r.workspaceId === null && r.isActive)
      .map((r) => r.name);

    const primaryRole = roleNames.reduce<'super_admin' | 'vip_user' | 'free_user'>(
      (acc, name) => (ROLE_PRIORITY[name] > ROLE_PRIORITY[acc] ? (name as typeof acc) : acc),
      'free_user',
    );

    return {
      roles: roleNames,
      primaryRole,
      isSuperAdmin: primaryRole === 'super_admin',
      isVip: primaryRole === 'vip_user',
      isFreeUser: primaryRole === 'free_user',
      isLoading,
    };
  }, [data, isLoading]);
};
