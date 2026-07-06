'use client';

import { Button, Card, Descriptions, Form, Input, InputNumber, message, Select, Space, Switch, Tabs } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminPaymentService, type PaymentConfig } from '@/services/admin/payment';

const PaymentSettings = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('wechat');

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

  const tabItems = [
    {
      children: (
        <Card
          style={{ marginTop: 12 }}
          title={t('payment.wechat')}
          type="inner"
        >
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
          <Form.Item name={['wechat', 'payVersion']} label={t('payment.wechatPayVersion')}>
            <Select
              options={[
                { label: t('payment.wechatPayVersionV2'), value: 'V2' },
                { label: t('payment.wechatPayVersionV3'), value: 'V3' },
              ]}
            />
          </Form.Item>
          <Form.Item name={['wechat', 'merchantType']} label={t('payment.wechatMerchantType')}>
            <Select
              options={[
                { label: t('payment.wechatMerchantTypeOrdinary'), value: 'ordinary' },
                { label: t('payment.wechatMerchantTypeService'), value: 'service_provider' },
              ]}
            />
          </Form.Item>
          <Form.Item name={['wechat', 'paySignKey']} label={t('payment.wechatPaySignKey')}>
            <Input.Password placeholder={t('payment.wechatPaySignKeyPlaceholder')} />
          </Form.Item>
          <Form.Item name={['wechat', 'payAuthDir']} label={t('payment.wechatPayAuthDir')}>
            <Input placeholder={t('payment.wechatPayAuthDirPlaceholder')} />
          </Form.Item>
          <Form.Item name={['wechat', 'logo']} label={t('payment.wechatLogo')}>
            <Input placeholder={t('payment.wechatLogoPlaceholder')} />
          </Form.Item>
        </Card>
      ),
      key: 'wechat',
      label: t('payment.wechat'),
    },
    {
      children: (
        <Card
          style={{ marginTop: 12 }}
          title={t('payment.alipay')}
          type="inner"
        >
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
          <Form.Item name={['alipay', 'logo']} label={t('payment.alipayLogo')}>
            <Input placeholder={t('payment.alipayLogoPlaceholder')} />
          </Form.Item>
        </Card>
      ),
      key: 'alipay',
      label: t('payment.alipay'),
    },
    {
      children: (
        <Card
          style={{ marginTop: 12 }}
          title={t('payment.general')}
          type="inner"
        >
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
      ),
      key: 'general',
      label: t('payment.general'),
    },
    {
      children: (
        <Card
          style={{ marginTop: 12 }}
          title={t('paymentSdk.title')}
          type="inner"
        >
          <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 640 }}>
            <Card
              extra={<Button size="small" type="default">{t('paymentSdk.installed')}</Button>}
              size="small"
              title={t('paymentSdk.wechatpay')}
              type="inner"
            >
              <p style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
                {t('paymentSdk.wechatpayDesc')}
              </p>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Package">wechatpay-node-v3</Descriptions.Item>
                <Descriptions.Item label="Version">3.x</Descriptions.Item>
                <Descriptions.Item label="Status">{'✅ ' + t('paymentSdk.installed')}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card
              extra={<Button size="small" type="primary">{t('paymentSdk.installNow')}</Button>}
              size="small"
              title={t('paymentSdk.alipay')}
              type="inner"
            >
              <p style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
                {t('paymentSdk.alipayDesc')}
              </p>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Package">alipay-sdk</Descriptions.Item>
                <Descriptions.Item label="Version">3.x</Descriptions.Item>
                <Descriptions.Item label="Status">{'❌ ' + t('paymentSdk.notInstalled')}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        </Card>
      ),
      key: 'sdk',
      label: t('paymentSdk.title')!,
    },
  ];

  return (
    <div>
      <PageHeader title={t('payment.title')} />
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
        <Tabs activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
        <Space style={{ marginTop: 16 }}>
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
