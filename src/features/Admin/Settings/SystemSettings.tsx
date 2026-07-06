'use client';

import type { UpdateSystemConfigParams } from '@/services/admin/settings';
import { Button, Card, Form, Input, InputNumber, message, Select, Switch, Tabs } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';

import { adminSettingsService } from '@/services/admin/settings';

const SystemSettings = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [defaultAgentConfig, setDefaultAgentConfig] = useState<Record<string, unknown> | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [globalRes, agentRes] = await Promise.allSettled([
        adminSettingsService.getGlobalConfig(),
        adminSettingsService.getDefaultAgentConfig(),
      ]);
      if (globalRes.status === 'fulfilled') {
        const config = globalRes.value as unknown as Record<string, unknown>;
        form.setFieldsValue({
          defaultLanguage: config.defaultLanguage ?? '',
          logRetentionDays: config.logRetentionDays ?? 90,
          maxFileUploadSize: config.maxFileUploadSize ?? 50,
          registrationEnabled: config.registrationEnabled !== false,
          systemName: config.systemName ?? '',
        });
      }
      if (agentRes.status === 'fulfilled') {
        const agentConfig = agentRes.value as unknown as Record<string, unknown>;
        if (Object.keys(agentConfig).length > 0) setDefaultAgentConfig(agentConfig);
      }
    } catch {}
    setLoading(false);
  }, [form]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const params: UpdateSystemConfigParams = {
        defaultLanguage: values.defaultLanguage,
        maxFileUploadSize: values.maxFileUploadSize,
        registrationEnabled: values.registrationEnabled,
        systemName: values.systemName,
      };
      await adminSettingsService.updateSystemConfig(params);
      message.success(t('settings.saveSuccess'));
    } catch {
      message.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, t]);

  const tabItems = [
    {
      children: (
        <>
          <Form.Item label={t('settings.systemName')} name="systemName">
            <Input placeholder={t('settings.systemName')} />
          </Form.Item>
          <Form.Item label={t('settings.defaultLanguage')} name="defaultLanguage">
            <Select
              options={[
                { label: '中文', value: 'zh-CN' },
                { label: 'English', value: 'en-US' },
                { label: '日本語', value: 'ja-JP' },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('settings.systemLogo')} name="systemLogo">
            <Input placeholder={t('settings.systemLogo')} />
          </Form.Item>
          <Form.Item label={t('settings.icp')} name="icp">
            <Input placeholder={t('settings.icpPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('settings.contactEmail')} name="contactEmail">
            <Input placeholder={t('settings.contactEmailPlaceholder')} />
          </Form.Item>
        </>
      ),
      key: 'basic',
      label: t('settings.tabBasic'),
    },
    {
      children: (
        <>
          <Form.Item label={t('settings.registrationEnabled')} name="registrationEnabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label={t('settings.defaultRole')} name="defaultRole">
            <Input placeholder={t('settings.defaultRolePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('settings.newUserCredits')} name="newUserCredits">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label={t('settings.newUserCompute')} name="newUserCompute">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
        </>
      ),
      key: 'registration',
      label: t('settings.tabRegistration'),
    },
    {
      children: (
        <>
          <Form.Item label={t('settings.maxFileUploadSize')} name="maxFileUploadSize">
            <InputNumber min={1} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label={t('settings.logRetentionDays')} name="logRetentionDays">
            <InputNumber min={1} style={{ width: 200 }} />
          </Form.Item>
        </>
      ),
      key: 'advanced',
      label: t('settings.tabAdvanced'),
    },
    {
      children: (
        <>
          <Form.Item label="SMTP Server" name="smtpServer">
            <Input placeholder="smtp.example.com" />
          </Form.Item>
          <Form.Item label="SMTP Port" name="smtpPort">
            <InputNumber min={1} max={65535} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label="SMTP Username" name="smtpUsername">
            <Input />
          </Form.Item>
          <Form.Item label="SMTP Password" name="smtpPassword">
            <Input.Password />
          </Form.Item>
          <Form.Item label="SMTP From" name="smtpFrom">
            <Input placeholder="noreply@example.com" />
          </Form.Item>
        </>
      ),
      key: 'notification',
      label: t('settings.tabNotification'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('settings.title')} />
      <Card loading={loading} style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical">
          <Tabs items={tabItems} />
        </Form>
        {/* 默认 Agent 配置（只读展示） */}
        {defaultAgentConfig && Object.keys(defaultAgentConfig).length > 0 && (
          <div
            style={{
              background: 'var(--ant-color-bg-layout)',
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
              fontSize: 12,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>默认 Agent 配置</div>
            <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(defaultAgentConfig, null, 2)}</pre>
          </div>
        )}
        <Button loading={saving} onClick={handleSave} type="primary">
          {t('actions.save')}
        </Button>
      </Card>
    </div>
  );
});

SystemSettings.displayName = 'SystemSettings';

export default SystemSettings;
