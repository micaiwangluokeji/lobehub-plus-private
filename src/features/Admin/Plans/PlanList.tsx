'use client';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import {
  adminPlanService,
  type CreditConfig,
  type Plan,
  type CreatePlanParams,
} from '@/services/admin/plans';

const billingCycleColors: Record<string, string> = {
  monthly: 'blue',
  yearly: 'green',
  lifetime: 'orange',
};

const CreditSettingsSection = memo(() => {
  const { t } = useTranslation('admin');
  const [creditForm] = Form.useForm();
  const [savingCredit, setSavingCredit] = useState(false);

  const fetchCreditConfig = useCallback(async () => {
    try {
      const config = await adminPlanService.getCreditConfig();
      creditForm.setFieldsValue(config);
    } catch {
      message.error(t('plans.saveFailed'));
    }
  }, [creditForm, t]);

  useEffect(() => {
    fetchCreditConfig();
  }, [fetchCreditConfig]);

  const handleSaveCredit = useCallback(async () => {
    setSavingCredit(true);
    try {
      const values = await creditForm.validateFields();
      await adminPlanService.updateCreditConfig(values as CreditConfig);
      message.success(t('plans.saveSuccess'));
    } catch {
      message.error(t('plans.saveFailed'));
    } finally {
      setSavingCredit(false);
    }
  }, [creditForm, t]);

  return (
    <Card title={t('plans.creditSettings')} style={{ marginBottom: 16 }}>
      <p style={{ color: 'var(--ant-color-text-secondary)', marginBottom: 16, fontSize: 13 }}>
        {t('plans.creditSettingsDesc')}
      </p>
      <Form form={creditForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Form.Item name="pricePerCredit" label={t('plans.pricePerCredit')}>
          <InputNumber min={0.0001} step={0.001} style={{ width: 140 }} placeholder={t('plans.pricePerCreditPlaceholder')} />
        </Form.Item>
        <Form.Item name="minTopUpAmount" label={t('plans.minTopUpAmount')}>
          <InputNumber min={1} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="maxTopUpAmount" label={t('plans.maxTopUpAmount')}>
          <InputNumber min={1} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="bonusRate" label={t('plans.bonusRate')}>
          <InputNumber min={0} max={100} style={{ width: 100 }} placeholder={t('plans.bonusRatePlaceholder')} />
        </Form.Item>
        <Form.Item name="creditExpiryDays" label={t('plans.creditExpiryDays')}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="referralRewardCredits" label={t('plans.referralRewardCredits')}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
      </Form>
      <div style={{ marginTop: 16 }}>
        <Button type="primary" loading={savingCredit} onClick={handleSaveCredit}>
          {t('actions.save')}
        </Button>
      </div>
    </Card>
  );
});

CreditSettingsSection.displayName = 'CreditSettingsSection';

const PlanManagementSection = memo(() => {
  const { t } = useTranslation('admin');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form] = Form.useForm();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPlanService.listPlans();
      setPlans(data);
    } catch {
      message.error(t('plans.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreateModal = useCallback(() => {
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, sort: plans.length, billingCycle: 'monthly', features: [] });
    setModalOpen(true);
  }, [form, plans.length]);

  const openEditModal = useCallback(
    (plan: Plan) => {
      setEditingPlan(plan);
      form.setFieldsValue({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleModalOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const features = typeof values.features === 'string'
        ? values.features.split('\n').map((f: string) => f.trim()).filter(Boolean)
        : values.features;
      const payload: CreatePlanParams = { ...values, features };

      if (editingPlan) {
        await adminPlanService.updatePlan({ id: editingPlan.id, ...payload });
        message.success(t('plans.saveSuccess'));
      } else {
        await adminPlanService.createPlan(payload);
        message.success(t('plans.saveSuccess'));
      }
      setModalOpen(false);
      fetchPlans();
    } catch {
      message.error(t('plans.saveFailed'));
    }
  }, [editingPlan, fetchPlans, form, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminPlanService.deletePlan(id);
        message.success(t('plans.saveSuccess'));
        fetchPlans();
      } catch {
        message.error(t('plans.saveFailed'));
      }
    },
    [fetchPlans, t],
  );

  const columns = [
    { dataIndex: 'name', key: 'name', title: t('plans.columns.name') },
    {
      dataIndex: 'price',
      key: 'price',
      title: t('plans.columns.price'),
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    { dataIndex: 'monthlyCredits', key: 'monthlyCredits', title: t('plans.columns.monthlyCredits') },
    {
      dataIndex: 'billingCycle',
      key: 'billingCycle',
      title: t('plans.columns.billingCycle'),
      render: (cycle: string) => (
        <Tag color={billingCycleColors[cycle] || 'default'}>
          {t(`plans.${cycle}` as 'plans.monthly' | 'plans.yearly' | 'plans.lifetime')}
        </Tag>
      ),
    },
    {
      dataIndex: 'features',
      key: 'features',
      title: t('plans.columns.features'),
      render: (features: string[]) => (
        <Space size={4} wrap>
          {features?.map((f, i) => <Tag key={i}>{f}</Tag>)}
        </Space>
      ),
    },
    {
      dataIndex: 'enabled',
      key: 'enabled',
      title: t('plans.columns.enabled'),
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? t('plans.enabled') : t('plans.disabled')}
        </Tag>
      ),
    },
    { dataIndex: 'sort', key: 'sort', title: t('plans.columns.sort') },
    {
      key: 'actions',
      title: t('plans.columns.actions'),
      render: (_: unknown, record: Plan) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            {t('actions.edit')}
          </Button>
          <Popconfirm title={t('plans.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>
              {t('actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={t('plans.planManagement')}
        extra={
          <Button type="primary" onClick={openCreateModal}>
            {t('plans.create')}
          </Button>
        }
      >
        <Table
          dataSource={plans}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 24,
              width: 520,
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>
              {editingPlan ? t('plans.edit') : t('plans.create')}
            </h3>
            <Form form={form} layout="vertical">
              <Form.Item name="name" label={t('plans.form.name')} rules={[{ required: true }]}>
                <Input placeholder={t('plans.form.namePlaceholder')} />
              </Form.Item>
              <Form.Item name="price" label={t('plans.form.price')} rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder={t('plans.form.pricePlaceholder')} />
              </Form.Item>
              <Form.Item name="monthlyCredits" label={t('plans.form.monthlyCredits')} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder={t('plans.form.monthlyCreditsPlaceholder')} />
              </Form.Item>
              <Form.Item name="personalBudget" label={t('plans.form.personalBudget')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="workspaceBudget" label={t('plans.form.workspaceBudget')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="billingCycle" label={t('plans.form.billingCycle')} rules={[{ required: true }]}>
                <Input placeholder="monthly / yearly / lifetime" />
              </Form.Item>
              <Form.Item name="features" label={t('plans.form.features')}>
                <Input.TextArea rows={4} placeholder={t('plans.form.featuresPlaceholder')} />
              </Form.Item>
              <Form.Item name="sort" label={t('plans.columns.sort')}>
                <InputNumber min={0} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="enabled" label={t('plans.form.enabled')} valuePropName="checked">
                <Switch />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleModalOk}>
                  {t('actions.save')}
                </Button>
                <Button onClick={() => setModalOpen(false)}>{t('actions.cancel')}</Button>
              </Space>
            </Form>
          </div>
        </div>
      )}
    </>
  );
});

PlanManagementSection.displayName = 'PlanManagementSection';

const PlanList = memo(() => {
  const { t } = useTranslation('admin');

  return (
    <div>
      <PageHeader title={t('plans.title')} />
      <CreditSettingsSection />
      <PlanManagementSection />
    </div>
  );
});

PlanList.displayName = 'PlanList';
export default PlanList;
