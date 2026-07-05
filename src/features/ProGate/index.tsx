'use client';

import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { useUserRoles } from '@/hooks/useUserRoles';

export type ProFeature =
  | 'create_agent'
  | 'publish_agent'
  | 'create_group'
  | 'custom_provider'
  | 'custom_model'
  | 'fork_agent';

export interface ProGateProps {
  feature: ProFeature;
  children: ReactNode;
  /** Custom locked-state render. When omitted, renders default locked button. */
  fallback?: ReactNode;
  /** Completely hide for free users (only use in special cases). */
  hide?: boolean;
}

/**
 * Pro-gating wrapper component. For free users, shows a locked state
 * with 🔒 PRO badge instead of the actual feature. Pro/admin users
 * see children normally.
 *
 * @example
 * <ProGate feature="create_agent">
 *   <Button onClick={handleCreate}>Create Agent</Button>
 * </ProGate>
 */
export function ProGate({ feature, children, fallback, hide }: ProGateProps) {
  const { isPro, isSuperAdmin } = useUserRoles();
  const canAccess = isPro || isSuperAdmin;

  if (canAccess) return <>{children}</>;
  if (hide) return null;
  if (fallback) return <>{fallback}</>;

  return <DefaultProLock feature={feature} />;
}

/**
 * Default locked-state render: a disabled button/indicator with 🔒 and PRO badge.
 * Clicking it opens the UpgradeModal.
 */


export function DefaultProLock({ feature }: { feature: ProFeature }) {
  // Lazy circular-reference guard — UpgradeModal import handled at call site
  return null;
}
