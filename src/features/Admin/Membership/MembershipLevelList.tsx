'use client';

import { Button, Input, InputNumber, message, Modal, Popconfirm, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import {
  adminMembershipLevelService,
  type CreateMembershipLevelParams,
  type UpdateMembershipLevelParams,
} from '@/services/admin/membershipLevel';

interface MembershipLevelRecord {
  id: string;
  name: string;
  slug: string;
  level: number;
  minRechargeTotal: number;
  monthlyCreditsBonus: number;
  storageBonusMB: number;
  features: string[];
  icon?: string | null;
  color?: string | null;
  enabled: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

const MembershipLevelList = memo(() => {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<MembershipLevelRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MembershipLevelRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formLevel, setFormLevel] = useState(0);
  const [formMinRecharge, setFormMinRecharge] = useState(0);
  const [formCreditsBonus, setFormCreditsBonus] = useState(0);
  const [formStorageBonus, setFormStorageBonus] = useState(0);
  const [formFeatures, setFormFeatures] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formSort, setFormSort] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminMembershipLevelService.list();
      setData(result as MembershipLevelRecord[]);
    } catch {
      message.error(t('membership.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = useCallback(() => {
    setEditingRecord(null);
    setFormName('');
    setFormSlug('');
    setFormLevel(0);
    setFormMinRecharge(0);
    setFormCreditsBonus(0);
    setFormStorageBonus(0);
    setFormFeatures('');
    setFormIcon('');
    setFormColor('');
    setFormEnabled(true);
    setFormSort(0);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((record: MembershipLevelRecord) => {
    setEditingRecord(record);
    setFormName(record.name);
    setFormSlug(record.slug);
    setFormLevel(record.level);
    setFormMinRecharge(record.minRechargeTotal);
    setFormCreditsBonus(record.monthlyCreditsBonus);
    setFormStorageBonus(record.storageBonusMB);
    setFormFeatures((record.features || []).join('\n'));
    setFormIcon(record.icon || '');
    setFormColor(record.color || '');
    setFormEnabled(record.enabled);
    setFormSort(record.sort);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const features = formFeatures
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (editingRecord) {
        const params: UpdateMembershipLevelParams = {
          id: editingRecord.id,
          name: formName,
          slug: formSlug,
          level: formLevel,
          minRechargeTotal: formMinRecharge,
          monthlyCreditsBonus: formCreditsBonus,
          storageBonusMB: formStorageBonus,
          features,
          icon: formIcon || undefined,
          color: formColor || undefined,
          enabled: formEnabled,
          sort: formSort,
        };
        await adminMembershipLevelService.update(params);
        message.success(t('membership.updateSuccess'));
      } else {
        const params: CreateMembershipLevelParams = {
          name: formName,
          slug: formSlug,
          level: formLevel,
          minRechargeTotal: formMinRecharge,
          monthlyCreditsBonus: formCreditsBonus,
          storageBonusMB: formStorageBonus,
          features,
          icon: formIcon || undefined,
          color: formColor || undefined,
          enabled: formEnabled,
          sort: formSort,
        };
        await adminMembershipLevelService.create(params);
        message.success(t('membership.createSuccess'));
      }
      setModalOpen(false);
      fetchData();
    } catch {
      message.error(t('membership.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [editingRecord, formName, formSlug, formLevel, formMinRecharge, formCreditsBonus, formStorageBonus, formFeatures, formIcon, formColor, formEnabled, formSort, t, fetchData]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminMembershipLevelService.delete(id);
        message.success(t('membership.deleteSuccess'));
        fetchData();
      } catch {
        message.error(t('membership.deleteFailed'));
      }
    },
    [t, fetchData],
  );

  const columns: ColumnsType<MembershipLevelRecord> = [
    {
      title: t('membership.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (v: string, record) => (
        <span>
          {record.color ? <span style={{ color: record.color, marginRight: 6 }}>●</span> : null}
          {v}
        </span>
      ),
    },
    {
      title: t('membership.columns.slug'),
      dataIndex: 'slug',
      key: 'slug',
      width: 100,
    },
    {
      title: t('membership.columns.level'),
      dataIndex: 'level',
      key: 'level',
      width: 60,
    },
    {
      title: t('membership.columns.minRecharge'),
      dataIndex: 'minRechargeTotal',
      key: 'minRechargeTotal',
      width: 100,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: t('membership.columns.creditsBonus'),
      dataIndex: 'monthlyCreditsBonus',
      key: 'monthlyCreditsBonus',
      width: 80,
    },
    {
      title: t('membership.columns.storageBonus'),
      dataIndex: 'storageBonusMB',
      key: 'storageBonusMB',
      width: 80,
      render: (v: number) => (v > 0 ? `${v} MB` : '-'),
    },
    {
      title: t('membership.columns.features'),
      dataIndex: 'features',
      key: 'features',
      width: 180,
      render: (v: string[]) =>
        v && v.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {v.map((f, i) => (
              <Tag key={i}>{f}</Tag>
            ))}
          </div>
        ) : (
          '-'
        ),
    },
    {
      title: t('membership.columns.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v: boolean) =>
        v ? <Tag color="green">{t('membership.enabled')}</Tag> : <Tag color="red">{t('membership.disabled')}</Tag>,
    },
    {
      title: t('membership.columns.actions'),
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => openEdit(record)} size="small" type="link">
            {t('actions.edit')}
          </Button>
          <Popconfirm
            onConfirm={() => handleDelete(record.id)}
            title={t('membership.deleteConfirm')}
          >
            <Button danger size="small" type="link">
              {t('actions.delete')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle={t('membership.subtitle')} title={t('membership.title')}>
        <Button icon={<Plus size={16} />} onClick={openCreate} type="primary">
          {t('membership.create')}
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
          pagination={false}
          rowKey="id"
          size="middle"
        />
      </div>

      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => setModalOpen(false)}
        open={modalOpen}
        title={editingRecord ? t('membership.edit') : t('membership.create')}
        width={600}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.name')}
            </div>
            <Input
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('membership.form.namePlaceholder')}
              value={formName}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.slug')}
            </div>
            <Input
              disabled={!!editingRecord}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder={t('membership.form.slugPlaceholder')}
              value={formSlug}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.level')}
            </div>
            <InputNumber
              onChange={(val) => setFormLevel(val ?? 0)}
              style={{ width: '100%' }}
              value={formLevel}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.minRecharge')}
            </div>
            <InputNumber
              min={0}
              onChange={(val) => setFormMinRecharge(val ?? 0)}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
              value={formMinRecharge}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.creditsBonus')}
            </div>
            <InputNumber
              onChange={(val) => setFormCreditsBonus(val ?? 0)}
              style={{ width: '100%' }}
              value={formCreditsBonus}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.storageBonus')}
            </div>
            <InputNumber
              min={0}
              onChange={(val) => setFormStorageBonus(val ?? 0)}
              style={{ width: '100%' }}
              value={formStorageBonus}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.icon')}
            </div>
            <Input
              onChange={(e) => setFormIcon(e.target.value)}
              placeholder={t('membership.form.iconPlaceholder')}
              value={formIcon}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.color')}
            </div>
            <Input
              onChange={(e) => setFormColor(e.target.value)}
              placeholder={t('membership.form.colorPlaceholder')}
              value={formColor}
            />
          </div>
          <div style={{ flex: 1, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('membership.form.sort')}
            </div>
            <InputNumber
              onChange={(val) => setFormSort(val ?? 0)}
              style={{ width: '100%' }}
              value={formSort}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
            {t('membership.form.features')}
          </div>
          <Input.TextArea
            onChange={(e) => setFormFeatures(e.target.value)}
            placeholder={t('membership.form.featuresPlaceholder')}
            rows={4}
            value={formFeatures}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Switch checked={formEnabled} onChange={setFormEnabled} />
            <span style={{ fontSize: 13 }}>{t('membership.form.enabled')}</span>
          </label>
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

MembershipLevelList.displayName = 'MembershipLevelList';

export default MembershipLevelList;
