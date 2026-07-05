'use client';

import { Flexbox } from '@lobehub/ui';
import { DollarSign, TrendingUp, UserPlus, Zap } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building2, Bot, MessageSquare, FileText, Server } from 'lucide-react';
import useSWR from 'swr';

import { adminDashboardService } from '@/services/admin/dashboard';
import { adminRevenueService } from '@/services/admin/revenue';
import type { DashboardStats } from '@/services/admin/dashboard';

import StatCard from './StatCard';
import RecentUsers from './RecentUsers';
import RecentWorkspaces from './RecentWorkspaces';

const Dashboard = memo(() => {
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    messageCount: 0,
    fileCount: 0,
    providerCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: revenueStats } = useSWR('admin:revenue:stats', adminRevenueService.getDashboardStats);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminDashboardService.getStats(),
      adminDashboardService.getRecentUsers(),
      adminDashboardService.getRecentWorkspaces(),
    ])
      .then(([statsData, users, workspaces]) => {
        setStats(statsData);
        setRecentUsers(users);
        setRecentWorkspaces(workspaces);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: <DollarSign size={24} />, key: 'revenue', label: '今日收入', value: `¥${revenueStats?.totalRevenue ?? 0}` },
    { icon: <TrendingUp size={24} />, key: 'subscriptions', label: '活跃订阅', value: revenueStats?.activeSubscriptions ?? 0 },
    { icon: <UserPlus size={24} />, key: 'newUsers', label: '今日新用户', value: revenueStats?.newUsersToday ?? 0 },
    { icon: <Zap size={24} />, key: 'creditsUsed', label: '今日积分消耗', value: revenueStats?.creditsConsumedToday ?? 0 },
    { icon: <Users size={24} />, key: 'users', label: t('dashboard.stat.users'), value: stats.userCount },
    { icon: <Building2 size={24} />, key: 'workspaces', label: t('dashboard.stat.workspaces'), value: stats.workspaceCount },
    { icon: <Bot size={24} />, key: 'agents', label: t('dashboard.stat.agents'), value: stats.agentCount },
    { icon: <MessageSquare size={24} />, key: 'messages', label: t('dashboard.stat.messages'), value: stats.messageCount },
    { icon: <FileText size={24} />, key: 'files', label: t('dashboard.stat.files'), value: stats.fileCount },
    { icon: <Server size={24} />, key: 'providers', label: t('dashboard.stat.providers'), value: stats.providerCount },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: 'var(--ant-color-text)' }}>
        {t('dashboard.title')}
      </div>
      <Flexbox gap={12} horizontal style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        {statCards.map((card) => (
          <StatCard
            icon={card.icon}
            key={card.key}
            label={card.label}
            value={card.value}
          />
        ))}
      </Flexbox>
      <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
        <RecentUsers data={recentUsers} loading={loading} />
        <RecentWorkspaces data={recentWorkspaces} loading={loading} />
      </Flexbox>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
