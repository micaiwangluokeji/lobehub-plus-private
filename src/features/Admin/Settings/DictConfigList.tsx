'use client';

import { Button, Input, InputNumber, message, Modal, Popconfirm, Select, Switch, Tag } from 'antd';
import { Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';
import {
  adminDictConfigService,
  type DictConfigParams,
  type DictConfigRecord,
  type UpdateDictConfigParams,
} from '@/services/admin/dictConfig';

const typeColors: Record<string, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'orange',
  json: 'purple',
};

const groupLabels: Record<string, string> = {
  system_settings: '系统设置',
  payment_settings: '支付设置',
  membership_settings: '会员权益',
  feature_flags: '功能开关',
  ai_settings: 'AI 模型设置',
  content_settings: '内容审核',
  ui_settings: '界面设置',
  security_settings: '安全设置',
  notification_settings: '通知设置',
  storage_settings: '存储设置',
  integration_settings: '集成设置',
  rate_limits: '速率限制',
  other_settings: '其他设置',
};

const DictConfigList = memo(() => {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<DictConfigRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictConfigRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formGroup, setFormGroup] = useState('system_settings');
  const [formType, setFormType] = useState<string>('string');
  const [formSort, setFormSort] = useState(0);
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formValue, setFormValue] = useState('');
  const [formBooleanValue, setFormBooleanValue] = useState(false);
  const [formNumberValue, setFormNumberValue] = useState<number>(0);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string, grp?: string) => {
      setLoading(true);
      try {
        const res = await adminDictConfigService.list({
          group: grp,
          keyword: kw,
          page: p,
          pageSize: ps,
        });
        setData(res.data);
        setTotal(res.total);
      } catch {
        message.error(t('dictConfig.fetchFailed'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchData(page, pageSize, keyword, groupFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val, groupFilter);
    },
    [fetchData, groupFilter, pageSize],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword, groupFilter);
    },
    [fetchData, groupFilter, keyword],
  );

  const handleGroupChange = useCallback(
    (val: string | undefined) => {
      setGroupFilter(val);
      setPage(1);
      fetchData(1, pageSize, keyword, val);
    },
    [fetchData, keyword, pageSize],
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await adminDictConfigService.syncDefaults();
      message.success(result.message || '同步完成');
      fetchData(1, pageSize, keyword, groupFilter);
    } catch {
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  }, [fetchData, keyword, groupFilter, pageSize]);

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
      setFormValue(
        typeof record.value === 'string' ? record.value : JSON.stringify(record.value, null, 2),
      );
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
      fetchData(page, pageSize, keyword, groupFilter);
    } catch {
      message.error(t('dictConfig.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [
    editingRecord,
    formKey,
    formLabel,
    formGroup,
    formType,
    formSort,
    formDescription,
    formEnabled,
    buildValue,
    t,
    fetchData,
    page,
    pageSize,
    keyword,
    groupFilter,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminDictConfigService.delete(id);
        message.success(t('dictConfig.deleteSuccess'));
        fetchData(page, pageSize, keyword, groupFilter);
      } catch {
        message.error(t('dictConfig.deleteFailed'));
      }
    },
    [t, fetchData, page, pageSize, keyword, groupFilter],
  );

  // Extract unique groups from data for filter
  const groups = [...new Set(data.map((d) => d.group).filter(Boolean))].sort();

  const columns = [
    {
      dataIndex: 'key',
      key: 'key',
      render: (text: string) => <code>{text}</code>,
      title: t('dictConfig.columns.key'),
      width: 180,
    },
    {
      dataIndex: 'label',
      key: 'label',
      title: t('dictConfig.columns.label'),
      width: 160,
    },
    {
      dataIndex: 'group',
      key: 'group',
      render: (v: string) => <StatusTag status="system" text={groupLabels[v] || v} />,
      title: t('dictConfig.columns.group'),
      width: 120,
    },
    {
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag color={typeColors[v] || 'default'}>{v}</Tag>,
      title: t('dictConfig.columns.type'),
      width: 80,
    },
    {
      dataIndex: 'value',
      ellipsis: true,
      key: 'value',
      render: (v: unknown) => {
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'object' && v !== null) return JSON.stringify(v);
        return String(v ?? '');
      },
      title: t('dictConfig.columns.value'),
    },
    {
      dataIndex: 'enabled',
      key: 'enabled',
      render: (val: boolean) => (
        <StatusTag
          status={val ? 'enabled' : 'disabled'}
          text={val ? t('dictConfig.enabled') : t('dictConfig.disabled')}
        />
      ),
      title: t('dictConfig.columns.status'),
      width: 80,
    },
    {
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => new Date(val).toLocaleString(),
      title: t('dictConfig.columns.createdAt'),
      width: 160,
    },
    {
      key: 'actions',
      render: (_: unknown, record: DictConfigRecord) => (
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
      title: t('dictConfig.columns.actions'),
      width: 140,
    },
  ];

  const renderValueInput = () => {
    switch (formType) {
      case 'boolean':
        return (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              {t('dictConfig.form.value')}
            </div>
            <Switch checked={formBooleanValue} onChange={setFormBooleanValue} />
          </div>
        );
      case 'number':
        return (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
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
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
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
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              {t('dictConfig.form.value')}
            </div>
            <Input onChange={(e) => setFormValue(e.target.value)} value={formValue} />
          </div>
        );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button loading={syncing} onClick={handleSync}>
              🔄 同步字典配置
            </Button>
            <Button icon={<Plus size={16} />} onClick={openCreate} type="primary">
              {t('dictConfig.create')}
            </Button>
          </div>
        }
        subtitle={t('dictConfig.subtitle')}
        title={t('dictConfig.title')}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('actions.search')} />
        <Select
          allowClear
          onChange={handleGroupChange}
          placeholder="按分类筛选"
          style={{ width: 200 }}
          value={groupFilter}
        >
          {groups.map((g) => (
            <Select.Option key={g} value={g}>
              {groupLabels[g] || g}
            </Select.Option>
          ))}
        </Select>
      </div>

      <AdminTable<DictConfigRecord>
        columns={columns}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />

      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => setModalOpen(false)}
        open={modalOpen}
        title={editingRecord ? t('dictConfig.edit') : t('dictConfig.create')}
        width={560}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
              color: 'var(--ant-color-text-secondary)',
            }}
          >
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
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
              color: 'var(--ant-color-text-secondary)',
            }}
          >
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
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              {t('dictConfig.form.group')}
            </div>
            <Select
              onChange={setFormGroup}
              options={Object.entries(groupLabels).map(([value, label]) => ({ label, value }))}
              style={{ width: '100%' }}
              value={formGroup}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
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
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: 'var(--ant-color-text-secondary)',
              }}
            >
              {t('dictConfig.form.sort')}
            </div>
            <InputNumber
              onChange={(val) => setFormSort(val ?? 0)}
              style={{ width: '100%' }}
              value={formSort}
            />
          </div>
          <div
            style={{
              flex: 1,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-end',
              paddingBottom: 4,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Switch checked={formEnabled} onChange={setFormEnabled} />
              <span style={{ fontSize: 13 }}>{t('dictConfig.form.enabled')}</span>
            </label>
          </div>
        </div>
        {renderValueInput()}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
              color: 'var(--ant-color-text-secondary)',
            }}
          >
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
