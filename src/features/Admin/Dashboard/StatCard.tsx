'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const StatCard = memo<StatCardProps>(({ icon, label, value }) => (
  <Flexbox
    align="flex-start"
    gap={8}
    padding={20}
    style={{
      background: 'var(--ant-color-bg-container)',
      borderRadius: 12,
      border: '1px solid var(--ant-color-border-secondary)',
      flex: 1,
      minWidth: 160,
    }}
  >
    <div style={{ color: 'var(--ant-color-primary)', opacity: 0.7 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ant-color-text)' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginTop: 2 }}>{label}</div>
    </div>
  </Flexbox>
));

StatCard.displayName = 'StatCard';

export default StatCard;
