'use client';

import { Button, Drawer, Popconfirm, Select, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminMessage } from '@/services/admin/messages';
import { adminMessageService } from '@/services/admin/messages';

const MessageList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string, role?: string) => {
      setLoading(true);
      try {
        const res = await adminMessageService.list({ keyword: kw, role, page: p, pageSize: ps });
        const body = res as unknown as { data: { total: number; messages: AdminMessage[] } };
        setData(body.data.messages || []);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, pageSize, keyword, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val, roleFilter);
    },
    [fetchData, pageSize, roleFilter],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword, roleFilter);
    },
    [fetchData, keyword, roleFilter],
  );

  const handleRoleFilter = useCallback(
    (role: string | undefined) => {
      setRoleFilter(role);
      setPage(1);
      fetchData(1, pageSize, keyword, role);
    },
    [fetchData, pageSize, keyword],
  );

  const handleViewDetail = useCallback((msg: AdminMessage) => {
    setSelectedMessage(msg);
    setDetailOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminMessageService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword, roleFilter);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, roleFilter, t],
  );

  const roleColors: Record<string, string> = {
    assistant: 'green',
    system: 'default',
    user: 'blue',
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('messages.title')} />
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('messages.searchPlaceholder')} />
        <Select
          allowClear
          onChange={(val) => handleRoleFilter(val || undefined)}
          placeholder={t('messages.filterAllRoles')}
          size="middle"
          style={{ width: 130 }}
          value={roleFilter}
        >
          <Select.Option value="user">{t('messages.roleUser')}</Select.Option>
          <Select.Option value="assistant">{t('messages.roleAssistant')}</Select.Option>
          <Select.Option value="system">{t('messages.roleSystem')}</Select.Option>
        </Select>
      </div>
      <AdminTable<AdminMessage>
        columns={[
          {
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
              <StatusTag status={role === 'system' ? 'inactive' : 'enabled'} text={t(`messages.role${role.charAt(0).toUpperCase() + role.slice(1)}` as any) || role} />
            ),
            title: t('messages.columns.role'),
            width: 90,
          },
          {
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (text: string, record: AdminMessage) => (
              <span
                onClick={() => handleViewDetail(record)}
                style={{ color: 'var(--ant-color-primary)', cursor: 'pointer' }}
              >
                {text?.substring(0, 100)}{text?.length > 100 ? '...' : ''}
              </span>
            ),
            title: t('messages.columns.content'),
          },
          {
            dataIndex: 'model',
            key: 'model',
            render: (text: string | null) => (text ? <StatusTag status="enabled" text={text} /> : '-'),
            title: t('messages.columns.model'),
          },
          {
            dataIndex: 'tokens',
            key: 'tokens',
            render: (val: number | null) => (val != null ? val.toLocaleString() : '-'),
            title: t('messages.columns.tokens'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('messages.columns.time'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminMessage) => (
              <Space>
                <Button onClick={() => handleViewDetail(record)} size="small" type="link">
                  {t('messages.detail')}
                </Button>
                <Popconfirm
                  description={t('messages.deleteConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('actions.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('messages.columns.actions'),
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
      <Drawer
        onClose={() => {
          setDetailOpen(false);
          setSelectedMessage(null);
        }}
        open={detailOpen}
        title={t('messages.detail')}
        width={480}
      >
        {selectedMessage && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.columns.role')}</div>
              <StatusTag status={selectedMessage.role === 'system' ? 'inactive' : 'enabled'} text={t(`messages.role${selectedMessage.role.charAt(0).toUpperCase() + selectedMessage.role.slice(1)}` as any) || selectedMessage.role} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.columns.user')}</div>
              <div>{selectedMessage.userId || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.columns.model')}</div>
              <div>{selectedMessage.model || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.columns.tokens')}</div>
              <div>{selectedMessage.tokens?.toLocaleString() || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.detail.content')}</div>
              <div style={{ background: 'var(--ant-color-bg-layout)', borderRadius: 6, padding: 12, whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 300, overflow: 'auto' }}>
                {selectedMessage.content || '-'}
              </div>
            </div>
            {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>{t('messages.detail.metadata')}</div>
                <pre style={{ background: 'var(--ant-color-bg-layout)', borderRadius: 6, padding: 12, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(selectedMessage.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
