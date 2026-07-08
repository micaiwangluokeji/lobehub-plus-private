import { useMemo } from 'react';

import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { userKeys } from '@/libs/swr/keys';
import { rbacService } from '@/services/rbac';
import { authSelectors } from '@/store/user/slices/auth/selectors';
import { useUserStore } from '@/store/user';

export interface Permission {
  allowed: boolean;
  /**
   * Check whether the current user holds a specific RBAC permission code
   * (e.g. `'agent:update:all'`, `'agent:publish:owner'`). Returns `false`
   * while permissions are still loading.
   */
  hasPermission: (code: string) => boolean;
  reason: string;
}

/**
 * Map semantic action strings (used across 90+ call sites) to RBAC permission
 * codes. If the list is empty, the action is always allowed (no gating). If
 * non-empty, the user must hold at least one of the listed codes.
 *
 * Codes use the `resource:action:scope` format from `@lobechat/const/rbac`.
 */
const ACTION_PERMISSION_MAP: Record<string, string[]> = {
  // Creating agents / sessions / content — requires agent:create
  create_content: ['agent:create:all', 'agent:create:owner'],
  // Editing own resources — requires agent:update (free_user has :owner)
  edit_own_content: ['agent:update:all', 'agent:update:owner'],
  // Editing agent profile — requires agent:profile_update
  edit_agent_profile: ['agent:profile_update:all', 'agent:profile_update:owner'],
  // Editing group profile — requires group:profile_update
  edit_group_profile: ['group:profile_update:all', 'group:profile_update:owner'],
  // Personal settings — no special permission required
  manage_settings: [],
  // API key management — no special permission required for now
  manage_provider_key: [],
  // Publishing / unpublishing official agents — requires agent:update:all (super_admin only)
  manage_official_agents: ['agent:update:all'],
  // Publishing agents to discover page — admin (all) or Pro/VIP (owner only)
  publish_agent: ['agent:update:all', 'agent:publish:owner'],
  // Publishing groups to discover page — admin (all) or Pro/VIP (owner only)
  publish_group: ['group:publish:all', 'group:publish:owner'],
  // Billing & subscription management
  subscribe_plan: ['billing:read:all', 'billing:read:owner'],
  view_usage: ['billing:read:all', 'billing:read:owner'],
  manage_provider: ['ai_provider:create:all', 'ai_provider:create:owner'],
  manage_referral: ['referral:read:all', 'referral:read:owner'],
};

export const usePermission = (action: string): Permission => {
  const isLogin = useUserStore(authSelectors.isLogin);
  const { data: permissions, isLoading } = useOnlyFetchOnceSWR(
    isLogin ? userKeys.permissions() : null,
    () => rbacService.getUserPermissions(),
  );

  return useMemo(() => {
    const codes = ACTION_PERMISSION_MAP[action];
    const hasPermission = (code: string) => !!permissions && permissions.includes(code);

    // Unknown action or no permission codes required → always allow
    if (!codes || codes.length === 0) {
      return { allowed: true, hasPermission, reason: '' };
    }

    // While permissions are loading, optimistically allow.
    // The backend RBAC middleware is the ultimate gatekeeper.
    if (isLoading || !permissions) {
      return { allowed: true, hasPermission, reason: '' };
    }

    const allowed = codes.some((code) => permissions.includes(code));

    return {
      allowed,
      hasPermission,
      reason: allowed ? '' : '当前角色无此操作权限',
    };
  }, [action, permissions, isLoading]);
};
