'use client';

import { Flexbox } from '@lobehub/ui';
import { Tag } from 'antd';
import { memo } from 'react';

interface RecentWorkspace {
  id: string;
  name: string;
  slug: string;
  frozen: boolean;
  createdAt: string;
}

interface RecentWorkspacesProps {
  data: RecentWorkspace[];
  loading: boolean;
}

const RecentWorkspaces = memo<RecentWorkspacesProps>(({ data, loading }) => (
  <Flexbox
    padding={20}
    style={{
      background: 'var(--ant-color-bg-container)',
      borderRadius: 12,
      border: '1px solid var(--ant-color-border-secondary)',
      flex: 1,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--ant-color-text)' }}>
      最近创建工作区
    </div>
    {loading ? (
      <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>加载中...</div>
    ) : data.length === 0 ? (
      <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>暂无数据</div>
    ) : (
      data.map((ws) => (
        <Flexbox
          align="center"
          horizontal
          justify="space-between"
          key={ws.id}
          style={{ padding: '8px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ant-color-text)' }}>
              {ws.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-quaternary)', marginTop: 2 }}>
              {ws.slug}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ws.frozen && <Tag color="red">已冻结</Tag>}
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-quaternary)' }}>
              {new Date(ws.createdAt).toLocaleDateString()}
            </span>
          </div>
        </Flexbox>
      ))
    )}
  </Flexbox>
));

RecentWorkspaces.displayName = 'RecentWorkspaces';

export default RecentWorkspaces;
