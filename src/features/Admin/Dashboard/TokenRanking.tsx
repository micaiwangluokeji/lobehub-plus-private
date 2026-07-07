'use client';

import { Skeleton, Tabs } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { adminDashboardService } from '@/services/admin/dashboard';

interface RankingItem {
  name: string;
  tokens: number;
  percentage: number;
}

const RankingTable = memo<{ data: RankingItem[]; loading: boolean }>(({ data, loading }) => {
  const colors = ['var(--ant-color-primary)', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  const total = data.reduce((sum, d) => sum + d.tokens, 0) || 1;

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>
        暂无数据
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.slice(0, 10).map((item, index) => (
        <div key={item.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--ant-color-text)' }}>
              <span style={{ color: colors[index % colors.length], fontWeight: 600, marginRight: 6 }}>
                {index + 1}.
              </span>
              {item.name}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ant-color-text-quaternary)' }}>
              {item.tokens.toLocaleString()} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--ant-color-bg-layout)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(item.tokens / total) * 100}%`,
                height: '100%',
                background: colors[index % colors.length],
                borderRadius: 3,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

const TokenRanking = memo(() => {
  const { t } = useTranslation('admin');

  const { data: modelData, isLoading: modelLoading } = useSWR(
    'admin:dashboard:token-ranking-models',
    async () => {
      try {
        return await adminDashboardService.getTokenRanking('model');
      } catch {
        return null;
      }
    },
    { errorRetryCount: 0, revalidateOnFocus: false },
  );

  const { data: providerData, isLoading: providerLoading } = useSWR(
    'admin:dashboard:token-ranking-providers',
    async () => {
      try {
        return await adminDashboardService.getTokenRanking('provider');
      } catch {
        return null;
      }
    },
    { errorRetryCount: 0, revalidateOnFocus: false },
  );

  const tabItems = [
    {
      children: <RankingTable data={modelData ?? []} loading={modelLoading} />,
      key: 'models',
      label: t('dashboard.tokenRankingByModel'),
    },
    {
      children: <RankingTable data={providerData ?? []} loading={providerLoading} />,
      key: 'providers',
      label: t('dashboard.tokenRankingByProvider'),
    },
  ];

  return (
    <div
      style={{
        background: 'var(--ant-color-bg-container)',
        borderRadius: 12,
        border: '1px solid var(--ant-color-border-secondary)',
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--ant-color-text)' }}>
        {t('dashboard.tokenRanking')}
      </div>
      <Tabs items={tabItems} size="small" />
    </div>
  );
});

TokenRanking.displayName = 'TokenRanking';
RankingTable.displayName = 'RankingTable';
export default TokenRanking;
