'use client';

import type { UpdateSystemConfigParams } from '@/services/admin/settings';
import { Button, InputNumber, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/features/Admin/common';

import { adminSettingsService } from '@/services/admin/settings';

const SystemSettings = memo(() => {
  const { t } = useTranslation('admin');
  const [saving, setSaving] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [maxFileUploadSize, setMaxFileUploadSize] = useState(50);
  const [logRetentionDays, setLogRetentionDays] = useState(90);
  const [defaultAgentConfig, setDefaultAgentConfig] = useState<Record<string, unknown> | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const [globalRes, agentRes] = await Promise.allSettled([
        adminSettingsService.getGlobalConfig(),
        adminSettingsService.getDefaultAgentConfig(),
      ]);
      if (globalRes.status === 'fulfilled') {
        const config = globalRes.value as unknown as Record<string, unknown>;
        if (config.systemName) setSystemName(String(config.systemName));
        if (config.defaultLanguage) setDefaultLanguage(String(config.defaultLanguage));
        if (config.registrationEnabled !== undefined) setRegistrationEnabled(Boolean(config.registrationEnabled));
        if (config.maxFileUploadSize) setMaxFileUploadSize(Number(config.maxFileUploadSize));
        if (config.logRetentionDays) setLogRetentionDays(Number(config.logRetentionDays));
      }
      if (agentRes.status === 'fulfilled') {
        const agentConfig = agentRes.value as unknown as Record<string, unknown>;
        if (Object.keys(agentConfig).length > 0) setDefaultAgentConfig(agentConfig);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const params: UpdateSystemConfigParams = {
        defaultLanguage,
        maxFileUploadSize,
        registrationEnabled,
        systemName,
      };
      await adminSettingsService.updateSystemConfig(params);
      message.success(t('settings.saveSuccess'));
    } catch {
      message.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [defaultLanguage, maxFileUploadSize, registrationEnabled, systemName, t]);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader subtitle="" title={t('settings.title')} />
      <div style={{ maxWidth: 640 }}>
        {/* 基本信息 */}
        <div
          style={{
            background: 'var(--ant-color-bg-container)',
            borderRadius: 12,
            border: '1px solid var(--ant-color-border-secondary)',
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
            {t('settings.basicInfo')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
            {t('settings.basicInfoDesc')}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('settings.systemName')}
            </div>
            <input
              onChange={(e) => setSystemName(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6 }}
              value={systemName}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('settings.defaultLanguage')}
            </div>
            <select
              onChange={(e) => setDefaultLanguage(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--ant-color-border)', borderRadius: 6, height: 36 }}
              value={defaultLanguage}
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>

        {/* 功能开关 */}
        <div
          style={{
            background: 'var(--ant-color-bg-container)',
            borderRadius: 12,
            border: '1px solid var(--ant-color-border-secondary)',
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
            {t('settings.featureToggles')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
            {t('settings.featureTogglesDesc')}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              checked={registrationEnabled}
              onChange={(e) => setRegistrationEnabled(e.target.checked)}
              type="checkbox"
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14 }}>{t('settings.registrationEnabled')}</span>
          </label>
        </div>

        {/* 高级配置 */}
        <div
          style={{
            background: 'var(--ant-color-bg-container)',
            borderRadius: 12,
            border: '1px solid var(--ant-color-border-secondary)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
            {t('settings.advanced')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
            {t('settings.advancedDesc')}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('settings.maxFileUploadSize')}
            </div>
            <InputNumber
              min={1}
              onChange={(val) => setMaxFileUploadSize(val || 50)}
              style={{ width: 200 }}
              value={maxFileUploadSize}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--ant-color-text-secondary)' }}>
              {t('settings.logRetentionDays')}
            </div>
            <InputNumber
              min={1}
              onChange={(val) => setLogRetentionDays(val || 90)}
              style={{ width: 200 }}
              value={logRetentionDays}
            />
          </div>
        </div>

        {/* 默认 Agent 配置（只读展示） */}
        {defaultAgentConfig && Object.keys(defaultAgentConfig).length > 0 && (
          <div
            style={{
              background: 'var(--ant-color-bg-container)',
              borderRadius: 12,
              border: '1px solid var(--ant-color-border-secondary)',
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
              默认 Agent 配置
            </div>
            <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
              系统级默认 Agent 参数（通过环境变量 DEFAULT_AGENT_CONFIG 配置）
            </div>
            <pre
              style={{
                background: 'var(--ant-color-bg-layout)',
                borderRadius: 6,
                padding: 12,
                fontSize: 12,
                maxHeight: 300,
                overflow: 'auto',
                margin: 0,
              }}
            >
              {JSON.stringify(defaultAgentConfig, null, 2)}
            </pre>
          </div>
        )}

        <Button
          loading={saving}
          onClick={handleSave}
          size="large"
          type="primary"
        >
          {t('actions.save')}
        </Button>
      </div>
    </div>
  );
});

SystemSettings.displayName = 'SystemSettings';

export default SystemSettings;
