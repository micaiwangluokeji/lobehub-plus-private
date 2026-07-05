'use client';

import { Button, Drawer, Empty, Space } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader } from '@/features/Admin/common';

import type { AuditLog } from '@/services/admin/audit-logs';
import { adminAuditLogService } from '@/services/admin/audit-logs';

const AuditLogList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const offset = (p - 1) * ps;
        const res = await adminAuditLogService.list({ keyword: kw, limit: ps, offset });
        setData(res.data as AuditLog[]);
        setTotal(res.total);
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

  const handleViewDetail = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('auditLogs.title')} />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('auditLogs.searchPlaceholder')} />
      </div>
      <AdminTable<AuditLog>
        columns={[
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => (val ? new Date(val).toLocaleString() : '-'),
            title: t('auditLogs.columns.time'),
          },
          {
            dataIndex: 'userId',
            key: 'user',
            render: (text: string) => text || '-',
            title: t('auditLogs.columns.user'),
          },
          {
            dataIndex: 'action',
            key: 'action',
            render: (text: string) => text || '-',
            title: t('auditLogs.columns.action'),
          },
          {
            dataIndex: 'resourceType',
            key: 'resourceType',
            render: (text: string) => text || '-',
            title: t('auditLogs.columns.resourceType'),
          },
          {
            dataIndex: 'resourceId',
            key: 'resourceId',
            ellipsis: true,
            render: (text: string) => (text ? <code>{text.substring(0, 12)}...</code> : '-'),
            title: t('auditLogs.columns.resourceId'),
          },
          {
            dataIndex: 'ipAddress',
            key: 'ip',
            render: (text: string | null) => text || '-',
            title: t('auditLogs.columns.ip'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AuditLog) => (
              <Space>
                <Button onClick={() => handleViewDetail(record)} size="small" type="link">
                  {t('auditLogs.detail')}
                </Button>
              </Space>
            ),
            title: t('auditLogs.columns.actions'),
            width: 100,
          },
        ]}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
        locale={{ emptyText: <Empty description={t('auditLogs.backendPending')} /> }}
      />
      <Drawer
        onClose={() => {
          setDetailOpen(false);
          setSelectedLog(null);
        }}
        open={detailOpen}
        title={t('auditLogs.detail')}
        width={480}
      >
        {selectedLog && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.time')}</div>
              <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.user')}</div>
              <div>{selectedLog.userId || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.action')}</div>
              <div>{selectedLog.action || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.resourceType')}</div>
              <div>{selectedLog.resourceType || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.resourceId')}</div>
              <div><code>{selectedLog.resourceId || '-'}</code></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('auditLogs.columns.ip')}</div>
              <div>{selectedLog.ipAddress || '-'}</div>
            </div>
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>元数据</div>
                <pre style={{ background: 'var(--ant-color-bg-layout)', borderRadius: 6, padding: 12, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
});

AuditLogList.displayName = 'AuditLogList';

export default AuditLogList;
