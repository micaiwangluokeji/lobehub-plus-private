'use client';

import { Button, Popconfirm, Space, Switch, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminModel } from '@/services/admin/models';
import { adminModelService } from '@/services/admin/models';

import type { AdminProvider } from '@/services/admin/providers';
import { adminProviderService } from '@/services/admin/providers';

const ModelList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [providerFilter, setProviderFilter] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async (p: number, ps: number, kw: string, pid?: string) => {
    setLoading(true);
    try {
      const res = await adminModelService.list({
        keyword: kw,
        page: p,
        pageSize: ps,
        providerId: pid,
      });
      const body = res as unknown as {
        data: { total: number; models: AdminModel[] };
      };
      setData(body.data.models);
      setTotal(body.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await adminProviderService.list({ page: 1, pageSize: 100 });
      const body = res as unknown as { data: { total: number; providers: AdminProvider[] } };
      setProviders(body.data.providers || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData(page, pageSize, keyword);
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val, providerFilter);
    },
    [fetchData, pageSize, providerFilter],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword, providerFilter);
    },
    [fetchData, keyword, providerFilter],
  );

  const handleToggleEnabled = useCallback(
    async (model: AdminModel, checked: boolean) => {
      try {
        await adminModelService.update(model.providerId, model.id, { enabled: checked });
        message.success(t('actions.save') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword, providerFilter);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, providerFilter, t],
  );

  const handleDelete = useCallback(
    async (record: AdminModel) => {
      try {
        await adminModelService.remove(record.providerId, record.id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword, providerFilter);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, providerFilter, t],
  );

  const handleProviderFilter = useCallback(
    (pid: string | undefined) => {
      setProviderFilter(pid);
      setPage(1);
      fetchData(1, pageSize, keyword, pid);
    },
    [fetchData, pageSize, keyword],
  );

  const providerMap = Object.fromEntries(providers.map((p) => [p.id, p]));

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('models.title')} />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('models.searchPlaceholder')} />
        <select
          onChange={(e) => handleProviderFilter(e.target.value || undefined)}
          style={{
            padding: '4px 8px',
            border: '1px solid var(--ant-color-border)',
            borderRadius: 6,
            height: 32,
            fontSize: 14,
          }}
          value={providerFilter || ''}
        >
          <option value="">{t('models.filterAllProviders')}</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <AdminTable<AdminModel>
        columns={[
          {
            dataIndex: 'slug',
            key: 'slug',
            render: (text: string) => <code>{text}</code>,
            title: t('models.columns.slug'),
          },
          {
            dataIndex: 'displayName',
            key: 'displayName',
            render: (text: string | null) => text || '-',
            title: t('models.columns.displayName'),
          },
          {
            dataIndex: 'providerId',
            key: 'provider',
            render: (providerId: string) => {
              const provider = providerMap[providerId];
              return <StatusTag status="enabled" text={provider?.name || providerId} />;
            },
            title: t('models.columns.provider'),
          },
          {
            dataIndex: 'enabled',
            key: 'enabled',
            render: (enabled: boolean, record: AdminModel) => (
              <Switch
                checked={enabled}
                onChange={(checked) => handleToggleEnabled(record, checked)}
                size="small"
              />
            ),
            title: t('models.columns.enabled'),
          },
          {
            dataIndex: 'sort',
            key: 'sort',
            render: (val: number | null) => val ?? '-',
            title: t('models.columns.sort'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('models.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminModel) => (
              <Space>
                <Popconfirm
                  description={t('models.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('models.columns.actions'),
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

ModelList.displayName = 'ModelList';

export default ModelList;
