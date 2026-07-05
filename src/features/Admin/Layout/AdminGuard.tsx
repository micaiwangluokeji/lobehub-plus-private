'use client';

import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserRoles } from '@/hooks/useUserRoles';

import { ErrorContent } from './ErrorContent';
import { LoadingScreen } from './LoadingScreen';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard: FC<AdminGuardProps> = ({ children }) => {
  const { t } = useTranslation('admin');
  const { isSuperAdmin, isLoading } = useUserRoles();

  // 🔧 Dev mode: skip permission check so developers can preview admin pages
  // without a super_admin account. The guard is enforced in production.
  if (__DEV__) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isSuperAdmin) {
    return <ErrorContent />;
  }

  return <>{children}</>;
};

export default AdminGuard;
