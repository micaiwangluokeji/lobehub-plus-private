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
  ShieldCheck,
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
  type?: 'divider' | 'group' | 'group-label' | undefined;
}

const AdminSidebar = memo(() => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = useMemo(
    () => [
      { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/admin' },

      // 数据看板
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.dashboard') },

      // 系统管理
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.systemManagement') },
      { icon: Users, label: t('nav.users'), path: '/admin/users' },
      { icon: Shield, label: t('nav.roles'), path: '/admin/roles' },
      { icon: KeyRound, label: t('nav.permissions'), path: '/admin/permissions' },
      { icon: ScrollText, label: t('nav.auditLogs'), path: '/admin/audit-logs' },
      { icon: Shield, label: t('nav.loginConfig'), path: '/admin/login-config' },

      // 智能体管理
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.agentManagement') },
      { icon: Building2, label: t('nav.workspaces'), path: '/admin/workspaces' },
      { icon: Bot, label: t('nav.agents'), path: '/admin/agents' },
      { icon: MessageSquare, label: t('nav.messages'), path: '/admin/messages' },
      { icon: FileText, label: t('nav.files'), path: '/admin/files' },
      { icon: Library, label: t('nav.knowledgeBases'), path: '/admin/knowledge-bases' },
      { icon: ShieldCheck, label: t('nav.review'), path: '/admin/review' },

      // AI 管理
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.aiManagement') },
      { icon: Cpu, label: t('nav.models'), path: '/admin/models' },
      { icon: Server, label: t('nav.providers'), path: '/admin/providers' },
      { icon: KeyRound, label: t('nav.apiKeys'), path: '/admin/api-keys' },

      // 财务中心
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.financeCenter') },
      { icon: CreditCard, label: t('nav.payment'), path: '/admin/payment' },
      { icon: Package, label: t('nav.plans'), path: '/admin/plans' },
      { icon: Star, label: t('nav.membership'), path: '/admin/membership' },
      { icon: CreditCard, label: t('nav.orders'), path: '/admin/orders' },
      { icon: DollarSign, label: t('nav.refundRequests'), path: '/admin/refund-requests' },
      { icon: DollarSign, label: t('nav.revenue'), path: '/admin/revenue' },
      { icon: TrendingUp, label: t('nav.subscriptions'), path: '/admin/subscriptions' },
      { icon: CreditCard, label: t('nav.creditTransactions'), path: '/admin/credit-transactions' },
      { icon: DollarSign, label: t('nav.spend'), path: '/admin/spend' },

      // 系统设置
      { type: 'divider' },
      { type: 'group-label' as const, label: t('navGroup.settings') },
      { icon: Settings, label: t('nav.settings'), path: '/admin/settings' },
      { icon: ListTree, label: t('nav.dictConfigs'), path: '/admin/dict-configs' },
      { icon: Settings, label: t('nav.decoration'), path: '/admin/decoration' },
      { icon: FileText, label: t('nav.agreement'), path: '/admin/agreement' },
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
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
          if (item.type === 'group-label') {
            return (
              <div
                key={`group-label-${index}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--ant-color-text-quaternary)',
                  padding: '12px 20px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {item.label}
              </div>
            );
          }
          const active = isActive(item.path);

          return (
            <div
              key={item.path}
              onClick={() => {
                if (item.path) navigate(item.path);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                cursor: 'pointer',
                color: active ? 'var(--ant-color-primary)' : 'var(--ant-color-text-secondary)',
                background: active ? 'var(--ant-color-primary-bg)' : 'transparent',
                borderRadius: 0,
                fontSize: 14,
              }}
              title={item.label}
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
