'use client';

import {
  Bot,
  Building2,
  Cpu,
  CreditCard,
  DollarSign,
  FileText,
  KeyRound,
  LayoutDashboard,
  Library,
  ListTree,
  MessageSquare,
  Package,
  ScrollText,
  Server,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { NavPanelPortal } from '@/features/NavPanel';

interface NavItem {
  icon?: typeof LayoutDashboard;
  label?: string;
  path?: string;
  type?: 'divider' | 'group' | undefined;
}

const AdminSidebar = memo(() => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = useMemo(
    () => [
      { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/admin' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: Users, label: t('nav.users'), path: '/admin/users' },
      { icon: Shield, label: t('nav.roles'), path: '/admin/roles' },
      { icon: KeyRound, label: t('nav.permissions'), path: '/admin/permissions' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: Building2, label: t('nav.workspaces'), path: '/admin/workspaces' },
      { icon: Bot, label: t('nav.agents'), path: '/admin/agents' },
      { icon: MessageSquare, label: t('nav.messages'), path: '/admin/messages' },
      { icon: FileText, label: t('nav.files'), path: '/admin/files' },
      { icon: Library, label: t('nav.knowledgeBases'), path: '/admin/knowledge-bases' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: Cpu, label: t('nav.models'), path: '/admin/models' },
      { icon: Server, label: t('nav.providers'), path: '/admin/providers' },
      { icon: KeyRound, label: t('nav.apiKeys'), path: '/admin/api-keys' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: ScrollText, label: t('nav.auditLogs'), path: '/admin/audit-logs' },
      { icon: Settings, label: t('nav.settings'), path: '/admin/settings' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: Star, label: t('nav.membership'), path: '/admin/membership' },
      { icon: ListTree, label: t('nav.dictConfigs'), path: '/admin/dict-configs' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: CreditCard, label: t('nav.payment'), path: '/admin/payment' },
      { icon: Package, label: t('nav.plans'), path: '/admin/plans' },
      { type: 'divider' },
      { type: 'group' as const },
      { icon: DollarSign, label: t('nav.revenue'), path: '/admin/revenue' },
      { icon: TrendingUp, label: t('nav.subscriptions'), path: '/admin/subscriptions' },
      { icon: CreditCard, label: t('nav.creditTransactions'), path: '/admin/credit-transactions' },
      { icon: DollarSign, label: t('nav.spend'), path: '/admin/spend' },
    ],
    [t],
  );

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <NavPanelPortal navKey="admin">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px 0' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            padding: '12px 20px 16px',
            color: 'var(--ant-color-text)',
          }}
        >
          {t('title')}
        </div>
        {navItems.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div
                key={`divider-${index}`}
                style={{
                  height: 1,
                  background: 'var(--ant-color-border-secondary)',
                  margin: '4px 16px',
                }}
              />
            );
          }
          if (item.type === 'group') {
            return null;
          }
          const active = isActive(item.path);
          const isComingSoon = ![
            '/admin',
            '/admin/users',
            '/admin/roles',
            '/admin/permissions',
            '/admin/workspaces',
            '/admin/agents',
            '/admin/models',
            '/admin/providers',
            '/admin/messages',
            '/admin/files',
            '/admin/knowledge-bases',
            '/admin/api-keys',
            '/admin/audit-logs',
            '/admin/settings',
            '/admin/dict-configs',
            '/admin/membership',
            '/admin/payment',
            '/admin/plans',
          ].includes(item.path!);

          return (
            <div
              key={item.path}
              onClick={() => {
                if (!isComingSoon && item.path) navigate(item.path);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                color: active
                  ? 'var(--ant-color-primary)'
                  : isComingSoon
                    ? 'var(--ant-color-text-quaternary)'
                    : 'var(--ant-color-text-secondary)',
                background: active ? 'var(--ant-color-primary-bg)' : 'transparent',
                borderRadius: 0,
                fontSize: 14,
                opacity: isComingSoon ? 0.5 : 1,
              }}
              title={isComingSoon ? t('comingSoon') : item.label}
            >
              {item.icon && <item.icon size={18} />}
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </NavPanelPortal>
  );
});

AdminSidebar.displayName = 'AdminSidebar';

export default AdminSidebar;
