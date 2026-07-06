'use client';

import { Button, Card, ColorPicker, Form, Input, InputNumber, Switch, Tabs, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import type { GlobalConfig } from '@/services/admin/settings';
import { adminSettingsService } from '@/services/admin/settings';

interface DecorationConfig {
  logo?: string;
  siteName?: string;
  favicon?: string;
  themeColor?: string;
  agreementContent?: string;
  freeNavItems?: string[];
  proNavItems?: string[];
}

const DecorationPage = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await adminSettingsService.getGlobalConfig();
      const gc = config as unknown as GlobalConfig;
      form.setFieldsValue({
        logo: gc.systemLogo ?? '',
        siteName: gc.systemName ?? '',
        favicon: (gc as Record<string, unknown>).favicon ?? '',
        themeColor: (gc as Record<string, unknown>).themeColor ?? '#1677ff',
      });
    } catch {
      // ignore
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
      await adminSettingsService.updateSystemConfig({
        systemName: values.siteName,
        ...(values.logo ? { systemLogo: values.logo } : undefined),
      } as any);
      message.success(t('settings.saveSuccess'));
    } catch {
      message.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, t]);

  const allNavItems = [
    { key: 'dashboard', label: t('nav.dashboard') },
    { key: 'users', label: t('nav.users') },
    { key: 'roles', label: t('nav.roles') },
    { key: 'permissions', label: t('nav.permissions') },
    { key: 'auditLogs', label: t('nav.auditLogs') },
    { key: 'workspaces', label: t('nav.workspaces') },
    { key: 'agents', label: t('nav.agents') },
    { key: 'messages', label: t('nav.messages') },
    { key: 'files', label: t('nav.files') },
    { key: 'knowledgeBases', label: t('nav.knowledgeBases') },
    { key: 'models', label: t('nav.models') },
    { key: 'providers', label: t('nav.providers') },
    { key: 'apiKeys', label: t('nav.apiKeys') },
    { key: 'payment', label: t('nav.payment') },
    { key: 'plans', label: t('nav.plans') },
    { key: 'membership', label: t('nav.membership') },
    { key: 'orders', label: t('nav.orders') },
    { key: 'refundRequests', label: t('nav.refundRequests') },
    { key: 'revenue', label: t('nav.revenue') },
    { key: 'subscriptions', label: t('nav.subscriptions') },
    { key: 'creditTransactions', label: t('nav.creditTransactions') },
    { key: 'spend', label: t('nav.spend') },
    { key: 'settings', label: t('nav.settings') },
    { key: 'dictConfigs', label: t('nav.dictConfigs') },
  ];

  const tabItems = [
    {
      children: (
        <>
          <Form.Item label={t('decoration.siteName')} name="siteName">
            <Input placeholder={t('decoration.siteNamePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('decoration.logo')} name="logo">
            <Input placeholder={t('decoration.logoPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('decoration.favicon')} name="favicon">
            <Input placeholder={t('decoration.faviconPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('decoration.themeColor')} name="themeColor">
            <ColorPicker
              format="hex"
              onChange={(c) => form.setFieldValue('themeColor', c.toHexString())}
            />
          </Form.Item>
        </>
      ),
      key: 'theme',
      label: t('decoration.themeSettings'),
    },
    {
      children: (
        <Card style={{ marginTop: 12 }} title={t('decoration.navVisibility')} type="inner">
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-secondary)', marginBottom: 16 }}>
            {t('decoration.navVisibilityDesc')}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--ant-color-bg-layout)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{t('decoration.navItem')}</th>
                <th style={{ padding: '8px 12px', width: 100, textAlign: 'center' }}>{t('decoration.roleFree')}</th>
                <th style={{ padding: '8px 12px', width: 100, textAlign: 'center' }}>{t('decoration.rolePro')}</th>
              </tr>
            </thead>
            <tbody>
              {allNavItems.map((item) => (
                <tr key={item.key} style={{ borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                  <td style={{ padding: '8px 12px' }}>{item.label}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <Form.Item name={['freeNavItems', item.key]} valuePropName="checked" noStyle>
                      <Switch size="small" />
                    </Form.Item>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <Form.Item name={['proNavItems', item.key]} valuePropName="checked" noStyle>
                      <Switch defaultChecked size="small" />
                    </Form.Item>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ),
      key: 'nav',
      label: t('decoration.navVisibility'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('decoration.title')} />
      <Card loading={loading} style={{ maxWidth: 800 }}>
        <Form form={form} layout="vertical">
          <Tabs items={tabItems} />
          <Button loading={saving} onClick={handleSave} style={{ marginTop: 16 }} type="primary">
            {t('actions.save')}
          </Button>
        </Form>
      </Card>
    </div>
  );
});

DecorationPage.displayName = 'DecorationPage';
export default DecorationPage;
