'use client';

import { Button, Card, Form, Input, message, Select, Switch, Tabs } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminLoginConfigService, type LoginConfig } from '@/services/admin/loginConfig';

const defaultLoginConfig: LoginConfig = {
  allowedLoginMethods: ['account'],
  allowedRegisterMethods: ['account'],
  defaultLoginMethod: 'account',
  allowMultipleLogin: true,
  showPolicyAgreement: true,
};

const LoginConfigPage = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await adminLoginConfigService.getLoginConfig();
      form.setFieldsValue(config);
    } catch {
      form.setFieldsValue(defaultLoginConfig);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await adminLoginConfigService.updateLoginConfig(values);
      message.success(t('settings.saveSuccess'));
    } catch {
      message.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, t]);

  const methodOptions = [
    { label: t('loginConfig.methodAccount'), value: 'account' },
    { label: t('loginConfig.methodPhone'), value: 'phone' },
    { label: t('loginConfig.methodWechat'), value: 'wechat' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('loginConfig.title')} />
      <Card loading={loading} style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                children: (
                  <>
                    <Form.Item label={t('loginConfig.allowedLoginMethods')} name="allowedLoginMethods">
                      <Select
                        mode="multiple"
                        options={methodOptions}
                        placeholder={t('loginConfig.allowedLoginMethodsPlaceholder')}
                      />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.allowedRegisterMethods')} name="allowedRegisterMethods">
                      <Select
                        mode="multiple"
                        options={methodOptions}
                        placeholder={t('loginConfig.allowedRegisterMethodsPlaceholder')}
                      />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.defaultLoginMethod')} name="defaultLoginMethod">
                      <Select
                        options={methodOptions}
                        placeholder={t('loginConfig.defaultLoginMethodPlaceholder')}
                      />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.allowMultipleLogin')} name="allowMultipleLogin" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.showPolicyAgreement')} name="showPolicyAgreement" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </>
                ),
                key: 'login',
                label: t('loginConfig.loginSettings'),
              },
              {
                children: (
                  <>
                    <Form.Item label={t('loginConfig.smsProvider')} name="smsProvider">
                      <Select
                        allowClear
                        options={[
                          { label: '阿里云 SMS', value: 'aliyun' },
                          { label: '腾讯云 SMS', value: 'tencent' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.smsApiKey')} name="smsApiKey">
                      <Input.Password placeholder={t('loginConfig.smsApiKeyPlaceholder')} />
                    </Form.Item>
                    <Form.Item label={t('loginConfig.smsSignName')} name="smsSignName">
                      <Input placeholder={t('loginConfig.smsSignNamePlaceholder')} />
                    </Form.Item>
                  </>
                ),
                key: 'sms',
                label: t('loginConfig.smsSettings'),
              },
            ]}
          />
          <Button loading={saving} onClick={handleSave} type="primary">
            {t('actions.save')}
          </Button>
        </Form>
      </Card>
    </div>
  );
});

LoginConfigPage.displayName = 'LoginConfigPage';
export default LoginConfigPage;
