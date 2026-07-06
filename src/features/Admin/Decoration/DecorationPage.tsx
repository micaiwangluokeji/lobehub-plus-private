'use client';

import { Button, Card, ColorPicker, Form, Input, Switch, Tabs, message } from 'antd';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';
import { adminSettingsService } from '@/services/admin/settings';
import type { RbacRole } from '@/services/admin/roles';
import { adminRoleService } from '@/services/admin/roles';

/** Frontend nav items (not admin nav) */
interface NavItemConfig {
  i18nKey: string;
  key: string;
}

const FRONTEND_NAV_ITEMS: NavItemConfig[] = [
  // 主侧边栏导航
  { i18nKey: 'home', key: 'home' },
  { i18nKey: 'discover', key: 'discover' },
  { i18nKey: 'tasks', key: 'tasks' },
  { i18nKey: 'pages', key: 'pages' },
  { i18nKey: 'image', key: 'image' },
  { i18nKey: 'community', key: 'community' },
  { i18nKey: 'resource', key: 'resource' },
  { i18nKey: 'memory', key: 'memory' },
  // 设置入口
  { i18nKey: 'settings', key: 'settings' },
  // Settings 子页面
  { i18nKey: 'settings_profile', key: 'profile' },
  { i18nKey: 'settings_appearance', key: 'appearance' },
  { i18nKey: 'settings_provider', key: 'provider' },
  { i18nKey: 'settings_apikey', key: 'apikey' },
  { i18nKey: 'settings_about', key: 'about' },
  { i18nKey: 'settings_stats', key: 'stats' },
];

const navLabelMap: Record<string, string> = {
  home: '首页',
  discover: '发现',
  tasks: '任务',
  pages: '页面',
  image: '图片',
  community: '社区',
  resource: '资源',
  memory: '记忆',
  settings: '设置',
  profile: '设置 - 个人资料',
  appearance: '设置 - 外观',
  provider: '设置 - 模型供应商',
  apikey: '设置 - API 密钥',
  about: '设置 - 关于',
  stats: '设置 - 数据统计',
};

/** Convert snake_case to PascalCase, e.g. "free_user" → "FreeUser" */
const snakeToPascal = (s: string) =>
  s
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const DecorationPage = memo(() => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      setLoading(true);
      setRolesLoading(true);

      // 1. Fetch all active roles (max pageSize=500 per backend PaginationQuerySchema)
      let allRoles: RbacRole[] = [];
      try {
        const res = await adminRoleService.list({ keyword: '', page: 1, pageSize: 500 });
        const body = res as unknown as { data: { total: number; roles: RbacRole[] } };
        allRoles = (body?.data?.roles || []).filter((r: RbacRole) => r.isActive);
        setRoles(allRoles);
      } catch {
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }

      // 2. Fetch global config
      try {
        const config = await adminSettingsService.getGlobalConfig();
        const gc = config as Record<string, unknown>;
        form.setFieldsValue({
          siteName: (gc.systemName as string) ?? '',
          logo: (gc.systemLogo as string) ?? '',
          favicon: (gc.favicon as string) ?? '',
          themeColor: (gc.themeColor as string) ?? '#1677ff',
          primaryColor: (gc.primaryColor as string) ?? '#1677ff',
          neutralColor: (gc.neutralColor as string) ?? '',
        });

        // 3. Load nav visibility for all roles dynamically
        // Flag key format: showNav${PascalCase(navKey)}For${PascalCase(roleName)}
        // e.g. showNavHomeForFreeUser, showNavTasksForVipUser
        for (const nav of FRONTEND_NAV_ITEMS) {
          for (const role of allRoles) {
            const flagKey = `showNav${nav.key.charAt(0).toUpperCase()}${nav.key.slice(1)}For${snakeToPascal(role.name)}`;
            const defaultValue = gc[flagKey] !== false;
            form.setFieldValue(['navVisibility', nav.key, role.name], defaultValue);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();

      // Save theme settings via updateSystemConfig
      await adminSettingsService.updateSystemConfig({
        systemName: values.siteName,
        ...(values.logo ? { systemLogo: values.logo } : undefined),
        ...(values.favicon ? { favicon: values.favicon } : undefined),
        ...(values.themeColor ? { themeColor: values.themeColor } : undefined),
        ...(values.primaryColor ? { primaryColor: values.primaryColor } : undefined),
        ...(values.neutralColor ? { neutralColor: values.neutralColor } : undefined),
      } as any);

      // Save nav visibility for all roles dynamically
      const navVisibility: Record<string, boolean> = {};
      if (values.navVisibility) {
        for (const navKey of Object.keys(values.navVisibility)) {
          for (const roleKey of Object.keys(values.navVisibility[navKey])) {
            const checked = values.navVisibility[navKey][roleKey];
            if (checked !== undefined) {
              navVisibility[`${navKey}_${roleKey}`] = checked;
            }
          }
        }
      }
      if (Object.keys(navVisibility).length > 0) {
        await adminSettingsService.updateNavVisibility(navVisibility);
      }

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
          <Form.Item label={t('decoration.primaryColor')} name="primaryColor">
            <ColorPicker
              format="hex"
              onChange={(c) => form.setFieldValue('primaryColor', c.toHexString())}
            />
          </Form.Item>
          <Form.Item label={t('decoration.neutralColor')} name="neutralColor">
            <ColorPicker
              format="hex"
              onChange={(c) => form.setFieldValue('neutralColor', c.toHexString())}
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
          {roles.length === 0 && !rolesLoading && (
            <div style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13, padding: 16, textAlign: 'center' }}>
              {t('decoration.noRolesHint')}
            </div>
          )}
          {roles.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--ant-color-bg-layout)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>
                    {t('decoration.navItem')}
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.name}
                      style={{ padding: '8px 12px', width: 120, textAlign: 'center', fontWeight: 600 }}
                    >
                      {role.displayName || role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FRONTEND_NAV_ITEMS.map((nav) => (
                  <tr
                    key={nav.key}
                    style={{ borderBottom: '1px solid var(--ant-color-border-secondary)' }}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      {navLabelMap[nav.key] ?? nav.i18nKey}
                    </td>
                    {roles.map((role) => (
                      <td key={role.name} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <Form.Item
                          name={['navVisibility', nav.key, role.name]}
                          valuePropName="checked"
                          noStyle
                        >
                          <Switch size="small" />
                        </Form.Item>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
