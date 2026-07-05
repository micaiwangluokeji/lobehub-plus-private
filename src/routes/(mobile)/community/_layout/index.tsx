import { useEffect, type FC } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { usePermission } from '@/hooks/usePermission';

const Layout: FC = () => {
  const navigate = useNavigate();
  const { allowed: canManageOfficial } = usePermission('manage_official_agents');

  useEffect(() => {
    if (!canManageOfficial) {
      navigate('/');
    }
  }, [canManageOfficial, navigate]);

  if (!canManageOfficial) return null;

  return <Outlet />;
};

export default Layout;
