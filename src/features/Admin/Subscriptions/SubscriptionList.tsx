'use client';

import { Button, Card, DatePicker, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminSubscriptionService, type SubscriptionItem, type CreateSubscriptionParams } from '@/services/admin/subscriptions';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  active: 'green',
  canceled: 'orange',
  expired: 'red',
  past_due: 'purple',
};

const billingCycleLabels: Record<string, string> = {
  month: '月付',
  year: '年付',
};

const SubscriptionList = memo(() => {
  const { t } = useTranslation('admin');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionItem | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    planId: '',
    page: 1,
    pageSize: 20,
  });

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSubscriptionService.list(filters);
      setSubscriptions(data.data);
    } catch {
      message.error(t('subscriptions.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const openCreateModal = useCallback(() => {
    setEditingSubscription(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', billingCycle: 'month' });
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (subscription: SubscriptionItem) => {
      setEditingSubscription(subscription);
      form.setFieldsValue({
        ...subscription,
        currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : null,
        currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleModalOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateSubscriptionParams = {
        ...values,
        currentPeriodStart: values.currentPeriodStart?.toISOString(),
        currentPeriodEnd: values.currentPeriodEnd?.toISOString(),
      };

      if (editingSubscription) {
        await adminSubscriptionService.update(editingSubscription.id, payload);
        message.success(t('subscriptions.updateSuccess'));
      } else {
        await adminSubscriptionService.create(payload);
        message.success(t('subscriptions.createSuccess'));
      }
      setModalOpen(false);
      fetchSubscriptions();
    } catch {
      message.error(editingSubscription ? t('subscriptions.updateFailed') : t('subscriptions.createFailed'));
    }
  }, [form, editingSubscription, t, fetchSubscriptions]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminSubscriptionService.deleteSubscription(id);
        message.success(t('subscriptions.deleteSuccess'));
        fetchSubscriptions();
      } catch {
        message.error(t('subscriptions.deleteFailed'));
      }
    },
    [t, fetchSubscriptions],
  );

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await adminSubscriptionService.cancelSubscription(id);
        message.success(t('subscriptions.cancelSuccess'));
        fetchSubscriptions();
      } catch {
        message.error(t('subscriptions.cancelFailed'));
      }
    },
    [t, fetchSubscriptions],
  );

  const handleRenew = useCallback(
    async (id: string) => {
      try {
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1); // 默认续订 1 个月
        await adminSubscriptionService.renewSubscription(id, newPeriodEnd.toISOString());
        message.success(t('subscriptions.renewSuccess'));
        fetchSubscriptions();
      } catch {
        message.error(t('subscriptions.renewFailed'));
      }
    },
    [t, fetchSubscriptions],
  );

  const columns = [
    {
      title: t('subscriptions.columns.user'),
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
    },
    {
      title: t('subscriptions.columns.plan'),
      dataIndex: 'planId',
      key: 'planId',
      width: 150,
    },
    {
      title: t('subscriptions.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusKey = `subscriptions.status.${status}` as keyof typeof t;
        return <Tag color={statusColors[status]}>{t(statusKey as any)}</Tag>;
      },
    },
    {
      title: t('subscriptions.columns.billingCycle'),
      dataIndex: 'billingCycle',
      key: 'billingCycle',
      width: 100,
      render: (cycle: string) => billingCycleLabels[cycle] || cycle,
    },
    {
      title: t('subscriptions.columns.currentPeriodEnd'),
      dataIndex: 'currentPeriodEnd',
      key: 'currentPeriodEnd',
      width: 180,
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: t('subscriptions.columns.actions'),
      key: 'actions',
      width: 250,
      render: (_: any, record: SubscriptionItem) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            {t('actions.edit')}
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title={t('subscriptions.confirmCancel')}
              onConfirm={() => handleCancel(record.id)}
            >
              <Button size="small" danger>
                {t('actions.cancel')}
              </Button>
            </Popconfirm>
          )}
          <Button size="small" onClick={() => handleRenew(record.id)}>
            {t('actions.renew')}
          </Button>
          <Popconfirm
            title={t('subscriptions.confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              {t('actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('subscriptions.title')} />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('subscriptions.filterByUser')}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('subscriptions.filterByStatus')}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="active">{t('subscriptions.status.active')}</Select.Option>
            <Select.Option value="canceled">{t('subscriptions.status.canceled')}</Select.Option>
            <Select.Option value="expired">{t('subscriptions.status.expired')}</Select.Option>
            <Select.Option value="past_due">{t('subscriptions.status.past_due')}</Select.Option>
          </Select>
          <Button type="primary" onClick={openCreateModal}>
            {t('subscriptions.create')}
          </Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={subscriptions}
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
          }}
        />
      </Card>
      <Modal
        title={editingSubscription ? t('subscriptions.edit') : t('subscriptions.create')}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="userId" 
            label={t('subscriptions.columns.user')} 
            rules={[
              { required: true, message: t('subscriptions.userIdPlaceholder') },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户ID格式不正确' },
            ]}
          >
            <Input placeholder={t('subscriptions.userIdPlaceholder')} />
          </Form.Item>
          <Form.Item 
            name="planId" 
            label={t('subscriptions.columns.plan')} 
            rules={[
              { required: true, message: t('subscriptions.planIdPlaceholder') },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '套餐ID格式不正确' },
            ]}
          >
            <Input placeholder={t('subscriptions.planIdPlaceholder')} />
          </Form.Item>
          <Form.Item name="status" label={t('subscriptions.columns.status')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">{t('subscriptions.status.active')}</Select.Option>
              <Select.Option value="canceled">{t('subscriptions.status.canceled')}</Select.Option>
              <Select.Option value="expired">{t('subscriptions.status.expired')}</Select.Option>
              <Select.Option value="past_due">{t('subscriptions.status.past_due')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="billingCycle" label={t('subscriptions.columns.billingCycle')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="month">{billingCycleLabels.month}</Select.Option>
              <Select.Option value="year">{billingCycleLabels.year}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currentPeriodStart" label={t('subscriptions.currentPeriodStart')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currentPeriodEnd" label={t('subscriptions.currentPeriodEnd')} rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

SubscriptionList.displayName = 'SubscriptionList';

export default SubscriptionList;
