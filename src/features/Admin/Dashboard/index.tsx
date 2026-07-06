'use client';

import { Flexbox } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { DollarSign, TrendingUp, UserPlus, Zap } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Bot, FileText, MessageSquare, Server, Users } from 'lucide-react';
import useSWR from 'swr';

import { adminDashboardService } from '@/services/admin/dashboard';
import { adminRevenueService } from '@/services/admin/revenue';

import RecentUsers from './RecentUsers';
import RecentWorkspaces from './RecentWorkspaces';
import RevenueTrendChart from './RevenueTrendChart';
import StatCard from './StatCard';
import TokenRanking from './TokenRanking';
import UserTrendChart from './UserTrendChart';

interface RevenueCardStats {
  activeSubscriptions?: number;
  creditsConsumedToday?: number;
  newUsersToday?: number;
  totalRevenue?: number;
}

const swrConfig = { errorRetryCount: 0, revalidateOnFocus: false };

const Dashboard = memo(() => {
  const { t } = useTranslation('admin');

  const { data: statsData, isLoading: statsLoading } = useSWR(
    'admin:dashboard:stats',
    adminDashboardService.getStats,
    swrConfig,
  );
  const { data: recentUsersData, isLoading: usersLoading } = useSWR(
    'admin:dashboard:recent-users',
    adminDashboardService.getRecentUsers,
    swrConfig,
  );
  const { data: recentWorkspacesData, isLoading: workspacesLoading } = useSWR(
    'admin:dashboard:recent-workspaces',
    adminDashboardService.getRecentWorkspaces,
    swrConfig,
  );
  const { data: revenueStatsData, isLoading: revenueLoading } = useSWR(
    'admin:revenue:stats',
    adminRevenueService.getDashboardStats,
    swrConfig,
  );
  const revenueStats = revenueStatsData as unknown as RevenueCardStats | null;

  const statCards = [
    { icon: <DollarSign size={24} />, key: 'revenue', label: '今日收入', value: `¥${revenueStats?.totalRevenue ?? 0}`, loading: revenueLoading },
    { icon: <TrendingUp size={24} />, key: 'subscriptions', label: '活跃订阅', value: revenueStats?.activeSubscriptions ?? 0, loading: revenueLoading },
    { icon: <UserPlus size={24} />, key: 'newUsers', label: '今日新用户', value: revenueStats?.newUsersToday ?? 0, loading: revenueLoading },
    { icon: <Zap size={24} />, key: 'creditsUsed', label: '今日积分消耗', value: revenueStats?.creditsConsumedToday ?? 0, loading: revenueLoading },
    { icon: <Users size={24} />, key: 'users', label: t('dashboard.stat.users'), value: statsData?.userCount ?? 0, loading: statsLoading },
    { icon: <Building2 size={24} />, key: 'workspaces', label: t('dashboard.stat.workspaces'), value: statsData?.workspaceCount ?? 0, loading: statsLoading },
    { icon: <Bot size={24} />, key: 'agents', label: t('dashboard.stat.agents'), value: statsData?.agentCount ?? 0, loading: statsLoading },
    { icon: <MessageSquare size={24} />, key: 'messages', label: t('dashboard.stat.messages'), value: statsData?.messageCount ?? 0, loading: statsLoading },
    { icon: <FileText size={24} />, key: 'files', label: t('dashboard.stat.files'), value: statsData?.fileCount ?? 0, loading: statsLoading },
    { icon: <Server size={24} />, key: 'providers', label: t('dashboard.stat.providers'), value: statsData?.providerCount ?? 0, loading: statsLoading },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: 'var(--ant-color-text)' }}>
        {t('dashboard.title')}
      </div>
      <Flexbox gap={12} horizontal style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {statCards.map((card) =>
          card.loading ? (
            <Skeleton.Button active key={card.key} size="large" />
          ) : (
            <StatCard
              icon={card.icon}
              key={card.key}
              label={card.label}
              value={card.value as number}
            />
          ),
        )}
      </Flexbox>

      {/* Trend Charts */}
      <Flexbox gap={16} horizontal style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 360 }}><UserTrendChart /></div>
        <div style={{ flex: 1, minWidth: 360 }}><RevenueTrendChart /></div>
      </Flexbox>

      {/* Token Ranking */}
      <TokenRanking />

      {/* Recent data */}
      <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
        {usersLoading ? (
          <div style={{ flex: 1 }}><Skeleton active /></div>
        ) : (
          <RecentUsers data={recentUsersData ?? []} loading={false} />
        )}
        {workspacesLoading ? (
          <div style={{ flex: 1 }}><Skeleton active /></div>
        ) : (
          <RecentWorkspaces data={recentWorkspacesData ?? []} loading={false} />
        )}
      </Flexbox>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;
