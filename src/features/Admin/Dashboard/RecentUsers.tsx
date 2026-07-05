'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

interface RecentUser {
  id: string;
  username: string | null;
  email: string | null;
  createdAt: string;
}

interface RecentUsersProps {
  data: RecentUser[];
  loading: boolean;
}

const RecentUsers = memo<RecentUsersProps>(({ data, loading }) => (
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
      最近注册用户
    </div>
    {loading ? (
      <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>加载中...</div>
    ) : data.length === 0 ? (
      <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>暂无数据</div>
    ) : (
      data.map((user) => (
        <Flexbox
          align="center"
          horizontal
          justify="space-between"
          key={user.id}
          style={{ padding: '8px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ant-color-text)' }}>
              {user.username || user.email || user.id}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-quaternary)', marginTop: 2 }}>
              {user.email || '-'}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ant-color-text-quaternary)' }}>
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </Flexbox>
      ))
    )}
  </Flexbox>
));

RecentUsers.displayName = 'RecentUsers';

export default RecentUsers;
