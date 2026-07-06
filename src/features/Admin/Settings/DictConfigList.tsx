'use client';

import { Button, Input, InputNumber, message, Modal, Popconfirm, Select, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import {
  adminDictConfigService,
  type DictConfigParams,
  type UpdateDictConfigParams,
} from '@/services/admin/dictConfig';

interface DictConfigRecord {
  id: string;
  key: string;
  value: unknown;
  label: string;
  group: string;
  type: string;
  sort: number;
  description?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const typeColors: Record<string, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'orange',
  json: 'purple',
};

const DictConfigList = memo(() => {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<DictConfigRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictConfigRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formGroup, setFormGroup] = useState('general');
  const [formType, setFormType] = useState<string>('string');
  const [formSort, setFormSort] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formValue, setFormValue] = useState('');
  const [formBooleanValue, setFormBooleanValue] = useState(false);
  const [formNumberValue, setFormNumberValue] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminDictConfigService.list();
      setData(result as DictConfigRecord[]);
    } catch {
      message.error(t('dictConfig.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = useCallback(() => {
    setEditingRecord(null);
    setFormKey('');
    setFormLabel('');
    setFormGroup('general');
    setFormType('string');
    setFormSort(0);
    setFormDescription('');
    setFormEnabled(true);
    setFormValue('');
    setFormBooleanValue(false);
    setFormNumberValue(0);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((record: DictConfigRecord) => {
    setEditingRecord(record);
    setFormKey(record.key);
    setFormLabel(record.label);
    setFormGroup(record.group);
    setFormType(record.type);
    setFormSort(record.sort);
    setFormDescription(record.description || '');
    setFormEnabled(record.enabled);
    if (record.type === 'boolean') {
      setFormBooleanValue(Boolean(record.value));
    } else if (record.type === 'number') {
      setFormNumberValue(Number(record.value));
    } else if (record.type === 'json') {
      setFormValue(typeof record.value === 'string' ? record.value : JSON.stringify(record.value, null, 2));
    } else {
      setFormValue(String(record.value ?? ''));
    }
    setModalOpen(true);
  }, []);

  const buildValue = useCallback(() => {
    switch (formType) {
      case 'boolean':
        return formBooleanValue;
      case 'number':
        return formNumberValue;
      case 'json':
        try {
          return JSON.parse(formValue);
        } catch {
          return formValue;
        }
      default:
        return formValue;
    }
  }, [formType, formBooleanValue, formNumberValue, formValue]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const value = buildValue();
      if (editingRecord) {
        const params: UpdateDictConfigParams = {
          id: editingRecord.id,
          label: formLabel,
          group: formGroup,
          type: formType as 'string' | 'number' | 'boolean' | 'json',
          sort: formSort,
          description: formDescription,
          enabled: formEnabled,
          value,
        };
        await adminDictConfigService.update(params);
        message.success(t('dictConfig.updateSuccess'));
      } else {
        const params: DictConfigParams = {
          key: formKey,
          label: formLabel,
          group: formGroup,
          type: formType as 'string' | 'number' | 'boolean' | 'json',
          sort: formSort,
          description: formDescription,
          enabled: formEnabled,
          value,
        };
        await adminDictConfigService.create(params);
        message.success(t('dictConfig.createSuccess'));
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error(t('dictConfig.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [editingRecord, formKey, formLabel, formGroup, formType, formSort, formDescription, formEnabled, buildValue, t, fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await adminDictConfigService.delete(id);
      message.success(t('dictConfig.deleteSuccess'));
      fetchData();
    } catch {
      message.error(t('dictConfig.deleteFailed'));
    }
  }, [t, fetchData]);

  const columns: ColumnsType<DictConfigRecord> = [
    {
      title: t('dictConfig.columns.key'),
      dataIndex: 'key',
      key: 'key',
      width: 180,
    },
    {
      title: t('dictConfig.columns.label'),
      dataIndex: 'label',
      key: 'label',
      width: 160,
    },
    {
      title: t('dictConfig.columns.group'),
      dataIndex: 'group',
      key: 'group',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: t('dictConfig.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v: string) => <Tag color={typeColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: t('dictConfig.columns.value'),
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (v: unknown) => {
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v ?? '');
      },
    },
    {
      title: t('dictConfig.columns.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v: boolean) =>
        v ? <Tag color="green">{t('dictConfig.enabled')}</Tag> : <Tag color="red">{t('dictConfig.disabled')}</Tag>,
    },
    {
      title: t('dictConfig.columns.actions'),
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => openEdit(record)} size="small" type="link">
            {t('actions.edit')}
          </Button>
          <Popconfirm
            onConfirm={() => handleDelete(record.id)}
            title={t('dictConfig.deleteConfirm')}
          >
            <Button danger size="small" type="link">
              {t('actions.delete')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const renderValueInput = () => {
    switch (formType) {
      case 'boolean':
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.value')}
            </div>
            <Switch checked={formBooleanValue} onChange={setFormBooleanValue} />
          </div>
        );
      case 'number':
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.value')}
            </div>
            <InputNumber
              onChange={(val) => setFormNumberValue(val ?? 0)}
              style={{ width: '100%' }}
              value={formNumberValue}
            />
          </div>
        );
      case 'json':
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.value')}
            </div>
            <Input.TextArea
              onChange={(e) => setFormValue(e.target.value)}
              rows={4}
              value={formValue}
            />
          </div>
        );
      default:
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.value')}
            </div>
            <Input onChange={(e) => setFormValue(e.target.value)} value={formValue} />
          </div>
        );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle={t('dictConfig.subtitle')} title={t('dictConfig.title')}>
        <Button icon={<Plus size={16} />} onClick={openCreate} type="primary">
          {t('dictConfig.create')}
        </Button>
      </PageHeader>

      <div
        style={{
          background: 'var(--ant-color-bg-container)',
          borderRadius: 12,
          border: '1px solid var(--ant-color-border-secondary)',
          overflow: 'hidden',
        }}
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{ pageSize: 20 }}
          rowKey="id"
          size="middle"
        />
      </div>

      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => setModalOpen(false)}
        open={modalOpen}
        title={editingRecord ? t('dictConfig.edit') : t('dictConfig.create')}
        width={560}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
            {t('dictConfig.form.key')}
          </div>
          <Input
            disabled={!!editingRecord}
            onChange={(e) => setFormKey(e.target.value)}
            placeholder={t('dictConfig.form.keyPlaceholder')}
            value={formKey}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
            {t('dictConfig.form.label')}
          </div>
          <Input
            onChange={(e) => setFormLabel(e.target.value)}
            placeholder={t('dictConfig.form.labelPlaceholder')}
            value={formLabel}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.group')}
            </div>
            <Input onChange={(e) => setFormGroup(e.target.value)} value={formGroup} />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.type')}
            </div>
            <Select
              onChange={setFormType}
              options={[
                { label: 'String', value: 'string' },
                { label: 'Number', value: 'number' },
                { label: 'Boolean', value: 'boolean' },
                { label: 'JSON', value: 'json' },
              ]}
              style={{ width: '100%' }}
              value={formType}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('dictConfig.form.sort')}
            </div>
            <InputNumber
              onChange={(val) => setFormSort(val ?? 0)}
              style={{ width: '100%' }}
              value={formSort}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Switch checked={formEnabled} onChange={setFormEnabled} />
              <span style={{ fontSize: 13 }}>{t('dictConfig.form.enabled')}</span>
            </label>
          </div>
        </div>
        {renderValueInput()}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
            {t('dictConfig.form.description')}
          </div>
          <Input.TextArea
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
            value={formDescription}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setModalOpen(false)}>{t('actions.cancel')}</Button>
          <Button loading={saving} onClick={handleSave} type="primary">
            {t('actions.save')}
          </Button>
        </div>
      </Modal>
    </div>
  );
});

DictConfigList.displayName = 'DictConfigList';

export default DictConfigList;
