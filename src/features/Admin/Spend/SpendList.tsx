'use client';

import { Button, Card, DatePicker, Form, Input, message, Space, Statistic, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminSpendService, type SpendLogItem, type DailyCostTrendItem, type ModelCostItem } from '@/services/admin/spend';
import { adminRevenueService, type SpendStats } from '@/services/admin/revenue';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<string, string> = {
  success: 'green',
  failed: 'red',
  timeout: 'orange',
};

const SpendList = memo(() => {
  const { t } = useTranslation('admin');
  const [spendLogs, setSpendLogs] = useState<SpendLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    modelId: '',
    createdAtAfter: '',
    createdAtBefore: '',
    page: 1,
    pageSize: 20,
  });

  const [stats, setStats] = useState<SpendStats | null>(null);

  const fetchSpendLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSpendService.list(filters);
      const body = res as unknown as { data: { data: SpendLogItem[] } };
      setSpendLogs(body?.data?.data ?? []);
    } catch {
      message.error(t('spend.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminRevenueService.getSpendStats({
        startDate: filters.createdAtAfter ? new Date(filters.createdAtAfter) : undefined,
        endDate: filters.createdAtBefore ? new Date(filters.createdAtBefore) : undefined,
      });
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch spend stats:', error);
    }
  }, [filters.createdAtAfter, filters.createdAtBefore]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSpendLogs();
  }, [fetchSpendLogs]);

  const columns = [
    {
      title: t('spend.columns.user'),
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
    },
    {
      title: t('spend.columns.model'),
      dataIndex: 'modelName',
      key: 'modelName',
      width: 150,
    },
    {
      title: t('spend.columns.totalTokens'),
      dataIndex: 'totalTokens',
      key: 'totalTokens',
      width: 120,
    },
    {
      title: t('spend.columns.totalCost'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      render: (cost: number) => <Text type="danger">¥{cost.toFixed(4)}</Text>,
    },
    {
      title: t('spend.columns.creditsConsumed'),
      dataIndex: 'creditsConsumed',
      key: 'creditsConsumed',
      width: 120,
    },
    {
      title: t('spend.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('spend.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader title={t('spend.title')} />
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Space size="large">
            <Statistic title="总消费（元）" value={stats.totalCost} precision={4} prefix="¥" />
            <Statistic title="总 Token 数" value={stats.totalTokens} />
            <Statistic title="总调用次数" value={stats.totalCalls} />
            <Statistic title="平均每次成本（元）" value={stats.averageCostPerCall} precision={4} prefix="¥" />
          </Space>
        </Card>
      )}
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('spend.filterByUser')}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            style={{ width: 200 }}
          />
          <Input
            placeholder={t('spend.filterByModel')}
            value={filters.modelId}
            onChange={(e) => setFilters({ ...filters, modelId: e.target.value })}
            style={{ width: 200 }}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  createdAtAfter: dates[0].toISOString(),
                  createdAtBefore: dates[1].toISOString(),
                });
              } else {
                setFilters({ ...filters, createdAtAfter: '', createdAtBefore: '' });
              }
            }}
          />
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={spendLogs}
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
          }}
        />
      </Card>
    </div>
  );
});

SpendList.displayName = 'SpendList';

export default SpendList;
