'use client';

import { Button, Popconfirm, Select, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminFile } from '@/services/admin/files';
import { adminFileService } from '@/services/admin/files';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
};

const FileList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminFile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string | undefined>(undefined);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string, ft?: string) => {
      setLoading(true);
      try {
        const res = await adminFileService.list({ keyword: kw, fileType: ft, page: p, pageSize: ps });
        const body = res as unknown as { data: { total: number; files: AdminFile[] } };
        setData(body.data.files || []);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, pageSize, keyword, fileTypeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val, fileTypeFilter);
    },
    [fetchData, pageSize, fileTypeFilter],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword, fileTypeFilter);
    },
    [fetchData, keyword, fileTypeFilter],
  );

  const handleFileTypeFilter = useCallback(
    (ft: string | undefined) => {
      setFileTypeFilter(ft);
      setPage(1);
      fetchData(1, pageSize, keyword, ft);
    },
    [fetchData, pageSize, keyword],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminFileService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword, fileTypeFilter);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, fileTypeFilter, t],
  );

  const fileTypes = ['image', 'pdf', 'text', 'audio', 'video', 'application'];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('files.title')} />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('files.searchPlaceholder')} />
        <Select
          allowClear
          onChange={(val) => handleFileTypeFilter(val || undefined)}
          placeholder={t('files.filterAllTypes')}
          size="middle"
          style={{ width: 130 }}
          value={fileTypeFilter}
        >
          {fileTypes.map((ft) => (
            <Select.Option key={ft} value={ft}>{ft}</Select.Option>
          ))}
        </Select>
      </div>
      <AdminTable<AdminFile>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => text || '-',
            title: t('files.columns.name'),
          },
          {
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <StatusTag status="enabled" text={type || '-'} />,
            title: t('files.columns.type'),
          },
          {
            dataIndex: 'size',
            key: 'size',
            render: (size: number) => formatFileSize(size || 0),
            title: t('files.columns.size'),
          },
          {
            dataIndex: 'userId',
            key: 'uploader',
            render: (text: string) => text || '-',
            title: t('files.columns.uploader'),
          },
          {
            dataIndex: 'chunkCount',
            key: 'chunkCount',
            render: (val: number | null) => (val != null ? val : '-'),
            title: t('files.columns.chunkCount'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('files.columns.time'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminFile) => (
              <Space>
                <Popconfirm
                  description={t('files.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('files.columns.actions'),
            width: 100,
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

FileList.displayName = 'FileList';

export default FileList;
