'use client';

import { Flexbox } from '@lobehub/ui';
import { memo, type ReactNode } from 'react';

interface PageHeaderProps {
  actions?: ReactNode;
  subtitle?: string;
  title: string;
}

const PageHeader = memo<PageHeaderProps>(({ title, subtitle, actions }) => (
  <Flexbox
    align="center"
    horizontal
    justify="space-between"
    style={{ marginBottom: 16, padding: '0 0 16px' }}
  >
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ant-color-text)' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
    {actions && <div>{actions}</div>}
  </Flexbox>
));

PageHeader.displayName = 'PageHeader';

export default PageHeader;
