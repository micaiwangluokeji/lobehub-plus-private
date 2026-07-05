'use client';

import { Button, message, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { lambdaClient } from '@/libs/trpc/client';

interface PaymentOrderRecord {
  id: string;
  userId: string;
  planId?: string | null;
  amount: number;
  credits: number;
  status: string;
  prepayId?: string | null;
  transactionId?: string | null;
  paidAt?: string | null;
  expiredAt: string;
  refundStatus?: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'processing',
  paid: 'green',
  expired: 'default',
  closed: 'default',
};

const OrderList = memo(() => {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<PaymentOrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use admin list if available, otherwise fallback
      const result = await lambdaClient.topUp.listMyOrders.query();
      setData(result as PaymentOrderRecord[]);
    } catch {
      message.error(t('orders.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<PaymentOrderRecord> = [
    { title: t('orders.columns.id'), dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
    { title: t('orders.columns.user'), dataIndex: 'userId', key: 'userId', width: 120, ellipsis: true },
    {
      title: t('orders.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    { title: t('orders.columns.credits'), dataIndex: 'credits', key: 'credits', width: 80 },
    {
      title: t('orders.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: t('orders.columns.transactionId'),
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: t('orders.columns.paidAt'),
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 160,
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: t('orders.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle={t('orders.subtitle')} title={t('orders.title')}>
        <Button onClick={fetchData}>{t('actions.search')}</Button>
      </PageHeader>
      <div
        style={{
          background: 'var(--ant-color-bg-container)',
          borderRadius: 12,
          border: '1px solid var(--ant-color-border-secondary)',
          overflow: 'hidden',
        }}
      >
        <Table columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} rowKey="id" />
      </div>
    </div>
  );
});

OrderList.displayName = 'OrderList';

export default OrderList;
