'use client';

import { Lock } from 'lucide-react';
import { Button, Tooltip } from 'antd';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useState } from 'react';

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
  fallback?: ReactNode;
  hide?: boolean;
}

const FEATURE_LABELS: Record<ProFeature, string> = {
  create_agent: '创建 Agent',
  custom_model: '自定义模型',
  custom_provider: '自定义服务商',
  create_group: '创建群组',
  fork_agent: 'Fork Agent',
  publish_agent: '发布到 Discover',
};

export function ProGate({ feature, children, fallback, hide }: ProGateProps) {
  const { isPro, isSuperAdmin } = useUserRoles();
  const canAccess = isPro || isSuperAdmin;

  if (canAccess) return <>{children}</>;
  if (hide) return null;
  if (fallback) return <>{fallback}</>;

  return <DefaultProLock feature={feature} />;
}

export function DefaultProLock({ feature }: { feature: ProFeature }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const label = FEATURE_LABELS[feature] || feature;

  const UpgradeModal = dynamic(() => import('./UpgradeModal'), { ssr: false });

  return (
    <>
      <Tooltip title={`升级 Pro 即可${label}`}>
        <Button disabled icon={<Lock size={14} />} onClick={() => setUpgradeOpen(true)}>
          {label}
        </Button>
      </Tooltip>
      {upgradeOpen && <UpgradeModal feature={feature} open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />}
    </>
  );
}
