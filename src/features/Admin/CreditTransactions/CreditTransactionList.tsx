'use client';

import { Button, Card, DatePicker, Form, Input, message, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminCreditTransactionService, type CreditTransactionItem } from '@/services/admin/credit-transactions';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const typeColors: Record<string, string> = {
  top_up: 'green',
  consumption: 'blue',
  refund: 'orange',
  bonus: 'purple',
  adjustment: 'red',
};

const CreditTransactionList = memo(() => {
  const { t } = useTranslation('admin');
  const [transactions, setTransactions] = useState<CreditTransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm] = Form.useForm();
  const [filters, setFilters] = useState({
    userId: '',
    type: '',
    createdAtAfter: '',
    createdAtBefore: '',
    page: 1,
    pageSize: 20,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCreditTransactionService.list(filters);
      setTransactions(data.data);
    } catch {
      message.error(t('creditTransactions.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAdjustCredits = useCallback(async () => {
    try {
      const values = await adjustForm.validateFields();
      await adminCreditTransactionService.adjustCredits({
        userId: values.userId,
        amount: values.amount,
        reason: values.reason,
      });
      message.success(t('creditTransactions.adjustSuccess'));
      setAdjustModalOpen(false);
      fetchTransactions();
    } catch {
      message.error(t('creditTransactions.adjustFailed'));
    }
  }, [adjustForm, t, fetchTransactions]);

  const columns = [
    {
      title: t('creditTransactions.columns.user'),
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
    },
    {
      title: t('creditTransactions.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeKey = `creditTransactions.type.${type}` as keyof typeof t;
        return <Tag color={typeColors[type]}>{t(typeKey as any)}</Tag>;
      },
    },
    {
      title: t('creditTransactions.columns.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text type={amount > 0 ? 'success' : 'danger'}>
          {amount > 0 ? `+${amount}` : amount}
        </Text>
      ),
    },
    {
      title: t('creditTransactions.columns.balanceAfter'),
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 120,
    },
    {
      title: t('creditTransactions.columns.source'),
      dataIndex: 'source',
      key: 'source',
      width: 150,
    },
    {
      title: t('creditTransactions.columns.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: t('creditTransactions.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader title={t('creditTransactions.title')} />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('creditTransactions.filterByUser')}
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder={t('creditTransactions.filterByType')}
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value })}
            allowClear
            style={{ width: 150 }}
          >
            <Select.Option value="top_up">{t('creditTransactions.type.top_up')}</Select.Option>
            <Select.Option value="consumption">{t('creditTransactions.type.consumption')}</Select.Option>
            <Select.Option value="refund">{t('creditTransactions.type.refund')}</Select.Option>
            <Select.Option value="bonus">{t('creditTransactions.type.bonus')}</Select.Option>
            <Select.Option value="adjustment">{t('creditTransactions.type.adjustment')}</Select.Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  createdAtAfter: dates[0].toISOString(),
                  createdAtBefore: dates[1].toISOString(),
                });
              } else {
                setFilters({ ...filters, createdAtAfter: '', createdAtBefore: '' });
              }
            }}
          />
          <Button type="primary" onClick={() => setAdjustModalOpen(true)}>
            {t('creditTransactions.adjustCredits')}
          </Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={transactions}
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
          }}
        />
      </Card>
      <Modal
        title={t('creditTransactions.adjustCredits')}
        open={adjustModalOpen}
        onOk={handleAdjustCredits}
        onCancel={() => setAdjustModalOpen(false)}
        width={500}
      >
        <Form form={adjustForm} layout="vertical">
          <Form.Item name="userId" label={t('creditTransactions.columns.user')} rules={[{ required: true }]}>
            <Input placeholder={t('creditTransactions.userIdPlaceholder')} />
          </Form.Item>
          <Form.Item name="amount" label={t('creditTransactions.columns.amount')} rules={[{ required: true }]}>
            <Input type="number" placeholder={t('creditTransactions.amountPlaceholder')} />
          </Form.Item>
          <Form.Item name="reason" label={t('creditTransactions.reason')} rules={[{ required: true }]}>
            <Input.TextArea placeholder={t('creditTransactions.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

CreditTransactionList.displayName = 'CreditTransactionList';

export default CreditTransactionList;
