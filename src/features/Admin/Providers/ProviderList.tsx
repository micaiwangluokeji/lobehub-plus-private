'use client';

import { Button, Popconfirm, Space, Switch, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminProvider } from '@/services/admin/providers';
import { adminProviderService } from '@/services/admin/providers';

const ProviderList = memo(() => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  const [data, setData] = useState<AdminProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const res = await adminProviderService.list({ keyword: kw, page: p, pageSize: ps });
        const body = res as unknown as {
          data: { total: number; providers: AdminProvider[] };
        };
        setData(body.data.providers);
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

  const handleToggleEnabled = useCallback(
    async (provider: AdminProvider, checked: boolean) => {
      try {
        await adminProviderService.update(provider.id, { enabled: checked });
        message.success(t('actions.save') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminProviderService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('providers.title')} />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('providers.searchPlaceholder')} />
      </div>
      <AdminTable<AdminProvider>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            title: t('providers.columns.name'),
          },
          {
            dataIndex: 'label',
            key: 'label',
            render: (text: string | null) => text || '-',
            title: t('providers.columns.label'),
          },
          {
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string | null) => text || '-',
            title: t('providers.columns.description'),
          },
          {
            dataIndex: 'enabled',
            key: 'enabled',
            render: (enabled: boolean, record: AdminProvider) => (
              <Switch
                checked={enabled}
                onChange={(checked) => handleToggleEnabled(record, checked)}
                size="small"
              />
            ),
            title: t('providers.columns.enabled'),
          },
          {
            dataIndex: 'sort',
            key: 'sort',
            render: (val: number | null) => val ?? '-',
            title: t('providers.columns.sort'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('models.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminProvider) => (
              <Space>
                <Button onClick={() => navigate(`/admin/providers/${record.id}`)} size="small" type="link">
                  {t('actions.edit')}
                </Button>
                <Popconfirm
                  description={t('providers.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('providers.columns.actions'),
            width: 160,
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

ProviderList.displayName = 'ProviderList';

export default ProviderList;
