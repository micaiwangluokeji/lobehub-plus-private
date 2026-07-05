'use client';

import { Button, Card, Form, Input, InputNumber, message, Select, Space, Switch } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminPaymentService, type PaymentConfig } from '@/services/admin/payment';

const PaymentSettings = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await adminPaymentService.getPaymentConfig();
      form.setFieldsValue(config);
    } catch {
      message.error(t('payment.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await adminPaymentService.updatePaymentConfig(values as PaymentConfig);
      message.success(t('payment.saveSuccess'));
    } catch {
      message.error(t('payment.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, t]);

  return (
    <div>
      <PageHeader title={t('payment.title')} />
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
        {/* WeChat Pay Card */}
        <Card title={t('payment.wechat')} style={{ marginBottom: 16 }}>
          <p style={{ color: 'var(--ant-color-text-secondary)', marginBottom: 16, fontSize: 13 }}>
            {t('payment.wechatDesc')}
          </p>
          <Form.Item name={['wechat', 'enabled']} label={t('payment.wechatEnabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['wechat', 'appId']} label={t('payment.wechatAppId')}>
            <Input placeholder={t('payment.wechatAppIdPlaceholder')} />
          </Form.Item>
          <Form.Item name={['wechat', 'mchId']} label={t('payment.wechatMchId')}>
            <Input placeholder={t('payment.wechatMchIdPlaceholder')} />
          </Form.Item>
          <Form.Item name={['wechat', 'apiKey']} label={t('payment.wechatApiKey')}>
            <Input.Password placeholder={t('payment.wechatApiKeyPlaceholder')} />
          </Form.Item>
          <Form.Item name={['wechat', 'apiCert']} label={t('payment.wechatApiCert')}>
            <Input.TextArea rows={3} placeholder={t('payment.wechatApiCertPlaceholder')} />
          </Form.Item>
        </Card>

        {/* Alipay Card */}
        <Card title={t('payment.alipay')} style={{ marginBottom: 16 }}>
          <p style={{ color: 'var(--ant-color-text-secondary)', marginBottom: 16, fontSize: 13 }}>
            {t('payment.alipayDesc')}
          </p>
          <Form.Item name={['alipay', 'enabled']} label={t('payment.alipayEnabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['alipay', 'appId']} label={t('payment.alipayAppId')}>
            <Input placeholder={t('payment.alipayAppIdPlaceholder')} />
          </Form.Item>
          <Form.Item name={['alipay', 'privateKey']} label={t('payment.alipayPrivateKey')}>
            <Input.Password placeholder={t('payment.alipayPrivateKeyPlaceholder')} />
          </Form.Item>
          <Form.Item name={['alipay', 'publicKey']} label={t('payment.alipayPublicKey')}>
            <Input.TextArea rows={2} placeholder={t('payment.alipayPublicKeyPlaceholder')} />
          </Form.Item>
          <Form.Item name={['alipay', 'gateway']} label={t('payment.alipayGateway')}>
            <Select
              options={[
                { label: t('payment.alipayGatewayProduction'), value: 'production' },
                { label: t('payment.alipayGatewaySandbox'), value: 'sandbox' },
              ]}
            />
          </Form.Item>
        </Card>

        {/* General Settings Card */}
        <Card title={t('payment.general')} style={{ marginBottom: 16 }}>
          <p style={{ color: 'var(--ant-color-text-secondary)', marginBottom: 16, fontSize: 13 }}>
            {t('payment.generalDesc')}
          </p>
          <Form.Item name={['general', 'currency']} label={t('payment.currency')}>
            <Select
              options={[
                { label: t('payment.currencyCny'), value: 'CNY' },
                { label: t('payment.currencyUsd'), value: 'USD' },
              ]}
            />
          </Form.Item>
          <Form.Item name={['general', 'paymentTimeout']} label={t('payment.paymentTimeout')}>
            <InputNumber min={1} max={120} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name={['general', 'notifyUrl']} label={t('payment.notifyUrl')}>
            <Input placeholder={t('payment.notifyUrlPlaceholder')} />
          </Form.Item>
        </Card>

        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {t('actions.save')}
          </Button>
        </Space>
      </Form>
    </div>
  );
});

PaymentSettings.displayName = 'PaymentSettings';
export default PaymentSettings;
