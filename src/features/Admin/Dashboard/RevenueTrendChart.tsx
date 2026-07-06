'use client';

import { Skeleton } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminDashboardService } from '@/services/admin/dashboard';

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

const RevenueTrendChart = memo(() => {
  const { t } = useTranslation('admin');

  const { data, isLoading } = useSWR(
    'admin:dashboard:revenue-trend',
    async () => {
      try {
        return await adminDashboardService.getRevenueTrend();
      } catch {
        return null;
      }
    },
    { errorRetryCount: 0, revalidateOnFocus: false },
  );

  const chartData: RevenuePoint[] = data ?? [];

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
        {t('dashboard.revenueTrend')}
      </div>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : chartData.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ant-color-text-quaternary)', fontSize: 13 }}>
          {t('dashboard.noData')}
        </div>
      ) : (
        <ResponsiveContainer height={200} width="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ant-color-border-secondary)" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: 'var(--ant-color-text-quaternary)' }} />
            <YAxis fontSize={12} tick={{ fill: 'var(--ant-color-text-quaternary)' }} />
            <Tooltip />
            <Legend />
            <Line dataKey="revenue" name={t('dashboard.revenueTrend')} stroke="var(--ant-color-primary)" strokeWidth={2} type="monotone" />
            <Line dataKey="orders" name={t('dashboard.orders')} stroke="#52c41a" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

RevenueTrendChart.displayName = 'RevenueTrendChart';
export default RevenueTrendChart;
