'use client';

import { Button, Modal, Popconfirm, Space, Switch, Tag, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminApiKey } from '@/services/admin/api-keys';
import { adminApiKeyService } from '@/services/admin/api-keys';

const ApiKeyList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKeyValue, setCreatedKeyValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiKeyService.list();
      setData(res as unknown as AdminApiKey[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = useCallback(() => {
    setNewKeyName('');
    setCreatedKeyValue(null);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newKeyName.trim()) {
      message.warning(t('apiKeys.form.name') + ' ' + t('actions.save'));
      return;
    }
    setSaving(true);
    try {
      const res = await adminApiKeyService.create({ name: newKeyName });
      // The create response may include the full key value
      const keyData = res as unknown as Record<string, unknown>;
      setCreatedKeyValue((keyData.key || keyData.id) as string);
      message.success(t('apiKeys.createSuccess'));
      fetchData();
    } catch {
    } finally {
      setSaving(false);
    }
  }, [newKeyName, fetchData, t]);

  const handleCloseCreate = useCallback(() => {
    if (createdKeyValue) {
      setCreateOpen(false);
      setCreatedKeyValue(null);
      setNewKeyName('');
    } else {
      setCreateOpen(false);
      setNewKeyName('');
    }
  }, [createdKeyValue]);

  const handleToggleEnabled = useCallback(
    async (key: AdminApiKey, checked: boolean) => {
      try {
        await adminApiKeyService.update(key.id, { enabled: checked });
        message.success(t('actions.save') + ' ' + t('actions.confirm'));
        fetchData();
      } catch {}
    },
    [fetchData, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminApiKeyService.remove(id);
        message.success(t('apiKeys.revoke') + ' ' + t('actions.confirm'));
        fetchData();
      } catch {}
    },
    [fetchData, t],
  );

  const maskApiKey = (key: string): string => {
    if (key.length <= 10) return key;
    return key.substring(0, 6) + '****' + key.substring(key.length - 4);
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Button onClick={handleCreate} type="primary">
            {t('apiKeys.create')}
          </Button>
        }
        subtitle=""
        title={t('apiKeys.title')}
      />
      <AdminTable<AdminApiKey>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            title: t('apiKeys.columns.name'),
          },
          {
            dataIndex: 'key',
            key: 'key',
            render: (text: string) => <code>{maskApiKey(text)}</code>,
            title: t('apiKeys.columns.key'),
          },
          {
            dataIndex: 'enabled',
            key: 'enabled',
            render: (enabled: boolean, record: AdminApiKey) => (
              <Switch
                checked={enabled}
                onChange={(checked) => handleToggleEnabled(record, checked)}
                size="small"
              />
            ),
            title: t('apiKeys.columns.status'),
          },
          {
            dataIndex: 'lastUsedAt',
            key: 'lastUsedAt',
            render: (val: string | null) => (val ? new Date(val).toLocaleString() : '-'),
            title: t('apiKeys.columns.lastUsed'),
          },
          {
            dataIndex: 'expiresAt',
            key: 'expiresAt',
            render: (val: string | null) => (val ? new Date(val).toLocaleString() : '-'),
            title: t('apiKeys.columns.expires'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('models.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminApiKey) => (
              <Space>
                <Popconfirm
                  description={t('apiKeys.revokeConfirm')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('apiKeys.revoke')}
                >
                  <Button danger size="small" type="link">
                    {t('apiKeys.revoke')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('apiKeys.columns.actions'),
            width: 100,
          },
        ]}
        dataSource={data}
        loading={loading}
        rowKey="id"
      />
      <Modal
        closable={!createdKeyValue}
        confirmLoading={saving}
        maskClosable={!createdKeyValue}
        onCancel={handleCloseCreate}
        onOk={createdKeyValue ? handleCloseCreate : handleCreateSubmit}
        okText={createdKeyValue ? t('actions.confirm') : t('apiKeys.create')}
        open={createOpen}
        title={t('apiKeys.create')}
      >
        {createdKeyValue ? (
          <div>
            <div style={{ color: 'var(--ant-color-success)', fontWeight: 600, marginBottom: 12 }}>
              {t('apiKeys.createSuccess')}
            </div>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--ant-color-warning)' }}>
              {t('apiKeys.copyPrompt')}
            </div>
            <div
              style={{
                background: 'var(--ant-color-bg-layout)',
                borderRadius: 6,
                padding: 12,
                fontFamily: 'monospace',
                fontSize: 13,
                wordBreak: 'break-all',
              }}
            >
              {createdKeyValue}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text-secondary)' }}>
                {t('apiKeys.form.name')}
              </div>
              <input
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={t('apiKeys.form.name')}
                style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6 }}
                value={newKeyName}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});

ApiKeyList.displayName = 'ApiKeyList';

export default ApiKeyList;
