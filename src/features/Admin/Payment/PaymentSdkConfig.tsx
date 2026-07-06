'use client';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Switch,
} from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';

/**
 * Payment SDK configuration page
 * This is a stub component for Batch 3 — currently displays placeholder
 * status and basic form fields. Backend SDK integration to be added later.
 */
const PaymentSdkConfig = memo(() => {
  const { t } = useTranslation('admin');
  const [wechatInstalled] = useState(true);
  const [alipayInstalled] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('paymentSdk.title')} />
      <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 640 }}>
        {/* WeChat Pay SDK */}
        <Card
          extra={
            <Button size="small" type={wechatInstalled ? 'default' : 'primary'}>
              {wechatInstalled ? t('paymentSdk.installed') : t('paymentSdk.installNow')}
            </Button>
          }
          title={t('paymentSdk.wechatpay')}
        >
          <p style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
            {t('paymentSdk.wechatpayDesc')}
          </p>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Package">wechatpay-node-v3</Descriptions.Item>
            <Descriptions.Item label="Version">3.x</Descriptions.Item>
            <Descriptions.Item label="Status">
              {wechatInstalled ? '✅ ' + t('paymentSdk.installed') : '❌ ' + t('paymentSdk.notInstalled')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Alipay SDK */}
        <Card
          extra={
            <Button size="small" type={alipayInstalled ? 'default' : 'primary'}>
              {alipayInstalled ? t('paymentSdk.installed') : t('paymentSdk.installNow')}
            </Button>
          }
          title={t('paymentSdk.alipay')}
        >
          <p style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, marginBottom: 16 }}>
            {t('paymentSdk.alipayDesc')}
          </p>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Package">alipay-sdk</Descriptions.Item>
            <Descriptions.Item label="Version">3.x</Descriptions.Item>
            <Descriptions.Item label="Status">
              {alipayInstalled ? '✅ ' + t('paymentSdk.installed') : '❌ ' + t('paymentSdk.notInstalled')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
});

PaymentSdkConfig.displayName = 'PaymentSdkConfig';
export default PaymentSdkConfig;
