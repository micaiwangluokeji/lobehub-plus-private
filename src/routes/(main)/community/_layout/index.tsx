import { Flexbox } from '@lobehub/ui';
import { type FC, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { usePermission } from '@/hooks/usePermission';

import Sidebar from './Sidebar';
import { styles } from './style';

const Layout: FC = () => {
  const navigate = useNavigate();
  const { allowed: canManageOfficial } = usePermission('manage_official_agents');

  useEffect(() => {
    if (!canManageOfficial) {
      navigate('/');
    }
  }, [canManageOfficial, navigate]);

  if (!canManageOfficial) return null;

  return (
    <>
      <Sidebar />
      <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
        <Outlet />
      </Flexbox>
    </>
  );
};

export default Layout;
