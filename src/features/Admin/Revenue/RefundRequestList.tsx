'use client';

import { Button, Input, message, Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { lambdaClient } from '@/libs/trpc/client';

interface RefundRequestRecord {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  reason?: string | null;
  status: string;
  reviewerId?: string | null;
  reviewNote?: string | null;
  wxRefundId?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'processing',
  approved: 'green',
  rejected: 'red',
  processing: 'orange',
  completed: 'blue',
  failed: 'red',
};

const RefundRequestList = memo(() => {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<RefundRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingRecord, setReviewingRecord] = useState<RefundRequestRecord | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await lambdaClient.refundRequest.list.query();
      setData(result as RefundRequestRecord[]);
    } catch {
      message.error(t('refund.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = useCallback(
    async (approved: boolean) => {
      if (!reviewingRecord) return;
      setReviewing(true);
      try {
        await lambdaClient.refundRequest.review.mutate({
          id: reviewingRecord.id,
          approved,
          reviewNote: reviewNote || undefined,
        });
        message.success(approved ? t('refund.approveSuccess') : t('refund.rejectSuccess'));
        setReviewModalOpen(false);
        setReviewNote('');
        fetchData();
      } catch {
        message.error(t('refund.reviewFailed'));
      } finally {
        setReviewing(false);
      }
    },
    [reviewingRecord, reviewNote, t, fetchData],
  );

  const openReview = useCallback((record: RefundRequestRecord) => {
    setReviewingRecord(record);
    setReviewNote('');
    setReviewModalOpen(true);
  }, []);

  const columns: ColumnsType<RefundRequestRecord> = [
    { title: t('refund.columns.id'), dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
    { title: t('refund.columns.user'), dataIndex: 'userId', key: 'userId', width: 120, ellipsis: true },
    { title: t('refund.columns.orderId'), dataIndex: 'orderId', key: 'orderId', width: 120, ellipsis: true },
    {
      title: t('refund.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: t('refund.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: t('refund.columns.reason'),
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: t('refund.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('refund.columns.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status === 'pending' ? (
          <Button onClick={() => openReview(record)} size="small" type="primary">
            {t('refund.review')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle={t('refund.subtitle')} title={t('refund.title')} />
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

      <Modal
        footer={null}
        onCancel={() => setReviewModalOpen(false)}
        open={reviewModalOpen}
        title={t('refund.reviewTitle')}
        width={480}
      >
        {reviewingRecord && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
                {t('refund.orderId')}: {reviewingRecord.orderId}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
                {t('refund.amount')}: ¥{reviewingRecord.amount.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ant-color-text-secondary)' }}>
                {t('refund.reason')}: {reviewingRecord.reason || '-'}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
                {t('refund.reviewNote')}
              </div>
              <Input.TextArea
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                value={reviewNote}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setReviewModalOpen(false)}>{t('actions.cancel')}</Button>
              <Button danger loading={reviewing} onClick={() => handleReview(false)}>
                {t('refund.reject')}
              </Button>
              <Button loading={reviewing} onClick={() => handleReview(true)} type="primary">
                {t('refund.approve')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
});

RefundRequestList.displayName = 'RefundRequestList';

export default RefundRequestList;
