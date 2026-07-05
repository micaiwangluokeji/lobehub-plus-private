'use client';

import { Button, Modal, Popconfirm, Space, Tag, message } from 'antd';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminWorkspaceInfo } from '@/services/admin/workspaces';
import { adminWorkspaceService } from '@/services/admin/workspaces';

import WorkspaceDetail from './WorkspaceDetail';

const WorkspaceList = memo(() => {
  const { t } = useTranslation('admin');

  const [allData, setAllData] = useState<AdminWorkspaceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<AdminWorkspaceInfo | null>(null);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezingWorkspace, setFreezingWorkspace] = useState<AdminWorkspaceInfo | null>(null);
  const [freezeReason, setFreezeReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminWorkspaceService.list();
      setAllData(res as unknown as AdminWorkspaceInfo[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!keyword) return allData;
    const kw = keyword.toLowerCase();
    return allData.filter(
      (w) =>
        w.name.toLowerCase().includes(kw) ||
        w.slug.toLowerCase().includes(kw),
    );
  }, [allData, keyword]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const total = filteredData.length;

  const handleSearch = useCallback((val: string) => {
    setKeyword(val);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleViewDetail = useCallback((workspace: AdminWorkspaceInfo) => {
    setSelectedWorkspace(workspace);
    setDetailOpen(true);
  }, []);

  const handleFreeze = useCallback((workspace: AdminWorkspaceInfo) => {
    setFreezingWorkspace(workspace);
    setFreezeReason('');
    setFreezeModalOpen(true);
  }, []);

  const handleConfirmFreeze = useCallback(async () => {
    if (!freezingWorkspace) return;
    try {
      await adminWorkspaceService.update({
        id: freezingWorkspace.id,
        frozen: !freezingWorkspace.frozen,
        frozenReason: freezingWorkspace.frozen ? undefined : freezeReason,
      });
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
      setFreezeModalOpen(false);
      setFreezingWorkspace(null);
      fetchData();
    } catch {}
  }, [freezingWorkspace, freezeReason, fetchData, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminWorkspaceService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData();
      } catch {}
    },
    [fetchData, t],
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('workspaces.title')} />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('workspaces.searchPlaceholder')} />
      </div>
      <AdminTable<AdminWorkspaceInfo>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: AdminWorkspaceInfo) => (
              <span
                onClick={() => handleViewDetail(record)}
                style={{ color: 'var(--ant-color-primary)', cursor: 'pointer' }}
              >
                {text || '-'}
              </span>
            ),
            title: t('workspaces.columns.name'),
          },
          {
            dataIndex: 'slug',
            key: 'slug',
            render: (text: string) => <code>{text}</code>,
            title: t('workspaces.columns.slug'),
          },
          {
            dataIndex: 'primaryOwnerId',
            key: 'owner',
            render: (text: string) => text || '-',
            title: t('workspaces.columns.owner'),
          },
          {
            dataIndex: 'frozen',
            key: 'status',
            render: (frozen: boolean) => (
              <StatusTag status={frozen ? 'banned' : 'active'} text={frozen ? t('workspaces.frozen') : t('workspaces.active')} />
            ),
            title: t('workspaces.columns.status'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('workspaces.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminWorkspaceInfo) => (
              <Space>
                <Button onClick={() => handleViewDetail(record)} size="small" type="link">
                  {t('workspaces.detail')}
                </Button>
                <Popconfirm
                  description={record.frozen ? t('workspaces.unfreeze') : t('workspaces.freezeConfirm')}
                  onConfirm={() => handleFreeze(record)}
                  title={record.frozen ? t('workspaces.unfreeze') : t('workspaces.freeze')}
                >
                  <Button size="small" type="link">
                    {record.frozen ? t('workspaces.unfreeze') : t('workspaces.freeze')}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  description={t('workspaces.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('workspaces.columns.actions'),
            width: 280,
          },
        ]}
        dataSource={pagedData}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      {detailOpen && selectedWorkspace && (
        <WorkspaceDetail
          onClose={() => {
            setDetailOpen(false);
            setSelectedWorkspace(null);
          }}
          open={detailOpen}
          workspaceId={selectedWorkspace.id}
        />
      )}
      {freezeModalOpen && freezingWorkspace && !freezingWorkspace.frozen && (
        <Modal
          onCancel={() => {
            setFreezeModalOpen(false);
            setFreezingWorkspace(null);
          }}
          onOk={handleConfirmFreeze}
          open={freezeModalOpen}
          title={t('workspaces.freeze')}
        >
          <div style={{ marginBottom: 8 }}>{t('workspaces.freezeConfirm')}</div>
          <input
            onChange={(e) => setFreezeReason(e.target.value)}
            placeholder={t('workspaces.freezeReason')}
            style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6 }}
            value={freezeReason}
          />
        </Modal>
      )}
    </div>
  );
});

WorkspaceList.displayName = 'WorkspaceList';

export default WorkspaceList;
