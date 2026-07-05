'use client';

import { Button, Popconfirm, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminAgent } from '@/services/admin/agents';
import { adminAgentService } from '@/services/admin/agents';

const AgentList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminAgent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const res = await adminAgentService.list({ keyword: kw, page: p, pageSize: ps });
        const body = res as unknown as { data: { total: number; agents: AdminAgent[] } };
        setData(body.data.agents);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, pageSize, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val);
    },
    [fetchData, pageSize],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword);
    },
    [fetchData, keyword],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminAgentService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('agents.title')} />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('agents.searchPlaceholder')} />
      </div>
      <AdminTable<AdminAgent>
        columns={[
          {
            dataIndex: 'title',
            key: 'title',
            title: t('agents.columns.title'),
          },
          {
            dataIndex: 'slug',
            key: 'slug',
            render: (text: string) => <code>{text}</code>,
            title: t('agents.columns.slug'),
          },
          {
            dataIndex: 'model',
            key: 'model',
            render: (text: string | null) =>
              text ? <StatusTag status="enabled" text={text} /> : '-',
            title: t('agents.columns.model'),
          },
          {
            dataIndex: 'userId',
            key: 'owner',
            render: (text: string | null) => text || '-',
            title: t('agents.columns.owner'),
          },
          {
            dataIndex: 'featured',
            key: 'featured',
            render: (featured: boolean) => (
              <StatusTag
                status={featured ? 'enabled' : 'disabled'}
                text={featured ? t('agents.featured') : t('agents.notFeatured')}
              />
            ),
            title: t('agents.columns.featured'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('agents.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminAgent) => (
              <Space>
                <Popconfirm
                  description={t('agents.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('agents.columns.actions'),
            width: 120,
          },
        ]}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
});

AgentList.displayName = 'AgentList';

export default AgentList;
