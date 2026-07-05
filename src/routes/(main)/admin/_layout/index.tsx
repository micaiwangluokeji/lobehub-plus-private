'use client';

import { Flexbox } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type FC } from 'react';
import { Outlet } from 'react-router';

import AdminGuard from '@/features/Admin/Layout/AdminGuard';
import AdminSidebar from '@/features/Admin/Layout/AdminSidebar';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    overflow: hidden;
    display: flex;
    height: 100%;
  `,
  content: css`
    position: relative;
    overflow: hidden auto;
    flex: 1;
    background: ${cssVar.colorBgLayout};
  `,
}));

const AdminLayout: FC = () => {
  return (
    <AdminGuard>
      <div className={styles.container}>
        <AdminSidebar />
        <Flexbox className={styles.content} flex={1}>
          <Outlet />
        </Flexbox>
      </div>
    </AdminGuard>
  );
};

export default AdminLayout;
