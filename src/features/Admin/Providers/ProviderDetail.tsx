'use client';

import { Button, InputNumber, Spin, Switch, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminProvider, UpdateProviderParams } from '@/services/admin/providers';
import { adminProviderService } from '@/services/admin/providers';

const ProviderDetail = memo(() => {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<AdminProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [sort, setSort] = useState<number>(0);
  const [enabled, setEnabled] = useState(true);
  const [checkModel, setCheckModel] = useState('');
  const [fetchOnClient, setFetchOnClient] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [sdkType, setSdkType] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminProviderService.getById(id);
      const data = res as unknown as AdminProvider;
      setProvider(data);
      setName(data.name || '');
      setLabel(data.label || '');
      setDescription(data.description || '');
      setSort(data.sort ?? 0);
      setEnabled(data.enabled);
      setCheckModel(data.checkModel || '');
      setFetchOnClient(data.fetchOnClient ?? false);
      const vaults = data.keyVaults as Record<string, string> | null;
      setApiKey(vaults?.apiKey || '');
      setBaseURL(vaults?.baseURL || '');
      const settings = data.settings as Record<string, unknown> | null;
      setSdkType((settings?.sdkType as string) || '');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      const params: UpdateProviderParams = {
        name: name || undefined,
        label: label || undefined,
        description: description || undefined,
        sort,
        enabled,
        checkModel: checkModel || undefined,
        fetchOnClient,
        keyVaults: apiKey || baseURL ? { apiKey: apiKey || undefined, baseURL: baseURL || undefined } as Record<string, string> : undefined,
        settings: { sdkType: sdkType || undefined } as Record<string, unknown>,
      };
      await adminProviderService.update(id, params);
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
      fetchData();
    } catch {
    } finally {
      setSaving(false);
    }
  }, [id, name, label, description, sort, enabled, checkModel, fetchOnClient, apiKey, baseURL, sdkType, t, fetchData]);

  if (loading) {
    return (
      <div style={{ alignItems: 'center', display: 'flex', height: 300, justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!provider) {
    return <div style={{ padding: 24, color: 'var(--ant-color-text-quaternary)' }}>Provider not found</div>;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 12px',
    border: '1px solid var(--ant-color-border)',
    borderRadius: 6,
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    color: 'var(--ant-color-text-secondary)',
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate('/admin/providers')}>{t('actions.cancel')}</Button>
            <Button loading={saving} onClick={handleSave} type="primary">
              {t('actions.save')}
            </Button>
          </div>
        }
        subtitle=""
        title={`${t('providers.edit')}: ${provider.name || id}`}
      />
      <div style={{ maxWidth: 640 }}>
        {/* 基本信息 */}
        <div style={{ background: 'var(--ant-color-bg-container)', borderRadius: 12, border: '1px solid var(--ant-color-border-secondary)', padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
            {t('settings.basicInfo')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
            Provider: {id} | Source: {provider.source || 'builtin'}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{t('providers.columns.name')}</div>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{t('providers.columns.label')}</div>
            <input style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{t('providers.columns.description')}</div>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{t('providers.columns.sort')}</div>
            <InputNumber min={0} value={sort} onChange={(val) => setSort(val ?? 0)} style={{ width: 200 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>{t('providers.columns.enabled')}</div>
            <Switch checked={enabled} onChange={(val) => setEnabled(val)} />
          </div>
        </div>

        {/* 全局 API 配置 */}
        <div style={{ background: 'var(--ant-color-bg-container)', borderRadius: 12, border: '1px solid var(--ant-color-border-secondary)', padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--ant-color-text)' }}>
            全局 API 配置
          </div>
          <div style={{ fontSize: 13, color: 'var(--ant-color-text-quaternary)', marginBottom: 20 }}>
            配置全局 API Key 和访问地址（覆盖用户个人配置）
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>API Key</div>
            <input
              placeholder="sk-..."
              style={inputStyle}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Base URL / Endpoint</div>
            <input
              placeholder="https://api.example.com/v1"
              style={inputStyle}
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>检查模型</div>
            <input style={inputStyle} value={checkModel} onChange={(e) => setCheckModel(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>SDK 类型</div>
            <select
              style={{ ...inputStyle, height: 36 }}
              value={sdkType}
              onChange={(e) => setSdkType(e.target.value)}
            >
              <option value="">默认</option>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure</option>
              <option value="bedrock">Bedrock</option>
              <option value="google">Google</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>客户端请求</div>
            <Switch checked={fetchOnClient} onChange={(val) => setFetchOnClient(val)} />
          </div>
        </div>
      </div>
    </div>
  );
});

ProviderDetail.displayName = 'ProviderDetail';

export default ProviderDetail;
