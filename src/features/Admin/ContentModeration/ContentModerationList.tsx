'use client';

import { Button, Card, Form, Input, message, Select, Space, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminContentModerationService, type ContentModerationLogItem } from '@/services/admin/content-moderation';

const { Text } = Typography;

const moderationResultColors: Record<string, string> = {
  safe: 'green',
  flagged: 'orange',
  blocked: 'red',
};

const statusColors: Record<string, string> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
};

const ContentModerationList = memo(() => {
  const { t } = useTranslation('admin');
  const [logs, setLogs] = useState<ContentModerationLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    contentType: '',
    moderationResult: '',
    status: '',
    page: 1,
    pageSize: 20,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminContentModerationService.list(filters);
      setLogs(data?.data ?? []);
    } catch {
      message.error(t('contentModeration.fetchFailed' as any));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      title: t('contentModeration.columns.user'),
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
    },
    {
      title: t('contentModeration.columns.contentType'),
      dataIndex: 'contentType',
      key: 'contentType',
      width: 120,
    },
    {
      title: t('contentModeration.columns.moderationResult'),
      dataIndex: 'moderationResult',
      key: 'moderationResult',
      width: 120,
      render: (result: string) => <Tag color={moderationResultColors[result]}>{result}</Tag>,
    },
    {
      title: t('contentModeration.columns.riskScore'),
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
    },
    {
      title: t('contentModeration.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: t('contentModeration.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('contentModeration.columns.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: ContentModerationLogItem) => (
        <Space>
          <Button size="small" onClick={() => handleApprove(record.id)}>
            {t('contentModeration.approve')}
          </Button>
          <Button size="small" danger onClick={() => handleReject(record.id)}>
            {t('contentModeration.reject')}
          </Button>
        </Space>
      ),
    },
  ];

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await adminContentModerationService.updateStatus(id, 'approved');
        message.success(t('contentModeration.approveSuccess'));
        fetchLogs();
      } catch {
        message.error(t('contentModeration.approveFailed'));
      }
    },
    [t, fetchLogs],
  );

  const handleReject = useCallback(
    async (id: string) => {
      try {
        await adminContentModerationService.updateStatus(id, 'rejected');
        message.success(t('contentModeration.rejectSuccess'));
        fetchLogs();
      } catch {
        message.error(t('contentModeration.rejectFailed'));
      }
    },
    [t, fetchLogs],
  );

  return (
    <div>
      <PageHeader title={t('contentModeration.title')} />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('contentModeration.filterByUser')}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('contentModeration.filterByContentType')}
            value={filters.contentType || undefined}
            onChange={(value) => setFilters({ ...filters, contentType: value })}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="message">Message</Select.Option>
            <Select.Option value="file">File</Select.Option>
            <Select.Option value="knowledge_base">Knowledge Base</Select.Option>
          </Select>
          <Select
            placeholder={t('contentModeration.filterByStatus')}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="pending">{t('contentModeration.status.pending')}</Select.Option>
            <Select.Option value="approved">{t('contentModeration.status.approved')}</Select.Option>
            <Select.Option value="rejected">{t('contentModeration.status.rejected')}</Select.Option>
          </Select>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
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

ContentModerationList.displayName = 'ContentModerationList';

export default ContentModerationList;
