'use client';

import { LoadingOutlined } from '@ant-design/icons';
import { Flexbox, FormGroup, Input, TextArea } from '@lobehub/ui';
import { Avatar, Spin } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';
import { useActiveWorkspace } from '@/business/client/hooks/useActiveWorkspace';
import { useWorkspaceStore } from '@/store/workspace';
import { fetchErrorNotification } from '@/components/Error/fetchErrorNotification';

const WorkspaceGeneral = () => {
  const { t } = useTranslation('setting');
  const activeWorkspace = useActiveWorkspace();
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<any>(null);
  const slugInputRef = useRef<any>(null);
  const descInputRef = useRef<any>(null);

  const handleSaveName = useCallback(async () => {
    const value = nameInputRef.current?.input?.value?.trim();
    if (!value || value === activeWorkspace?.name || !activeWorkspace) return;

    try {
      setSaving(true);
      await updateWorkspace({ id: activeWorkspace.id, name: value });
    } catch (error) {
      console.error('Failed to update workspace name:', error);
      fetchErrorNotification.error({
        errorMessage: error instanceof Error ? error.message : String(error),
        status: 500,
      });
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace, updateWorkspace]);

  const handleSaveSlug = useCallback(async () => {
    const value = slugInputRef.current?.input?.value?.trim();
    if (!value || value === activeWorkspace?.slug || !activeWorkspace) return;

    try {
      setSaving(true);
      await updateWorkspace({ id: activeWorkspace.id, slug: value });
    } catch (error) {
      console.error('Failed to update workspace slug:', error);
      fetchErrorNotification.error({
        errorMessage: error instanceof Error ? error.message : String(error),
        status: 500,
      });
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace, updateWorkspace]);

  const handleSaveDescription = useCallback(async () => {
    const value = descInputRef.current?.resizableTextArea?.textArea?.value?.trim();
    if (value === activeWorkspace?.description || !activeWorkspace) return;

    try {
      setSaving(true);
      await updateWorkspace({ id: activeWorkspace.id, description: value });
    } catch (error) {
      console.error('Failed to update workspace description:', error);
      fetchErrorNotification.error({
        errorMessage: error instanceof Error ? error.message : String(error),
        status: 500,
      });
    } finally {
      setSaving(false);
    }
  }, [activeWorkspace, updateWorkspace]);

  if (!activeWorkspace) {
    return (
      <Flexbox align="center" justify="center" style={{ height: 200 }}>
        <Spin />
      </Flexbox>
    );
  }

  return (
    <>
      <SettingHeader title={t('workspaceSetting.tab.general')} />
      <FormGroup collapsible={false} gap={16} title={t('workspaceSetting.group.general')} variant="filled">
        <Flexbox gap={24} style={{ padding: '16px 0' }}>
          <Flexbox align="center" gap={16} horizontal>
            <Avatar size={64} src={activeWorkspace.avatar}>
              {activeWorkspace.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Flexbox gap={4}>
              <Flexbox horizontal align="center" gap={8}>
                {saving && <Spin indicator={<LoadingOutlined spin />} size="small" />}
                <Input
                  defaultValue={activeWorkspace.name || ''}
                  disabled={saving}
                  key={activeWorkspace.name}
                  placeholder={t('workspaceSetting.tab.general')}
                  ref={nameInputRef}
                  style={{ width: 300 }}
                  variant="filled"
                  onBlur={handleSaveName}
                  onPressEnter={handleSaveName}
                />
              </Flexbox>
              <Flexbox horizontal align="center" gap={8} style={{ marginTop: 8 }}>
                <Input
                  addonBefore="/"
                  defaultValue={activeWorkspace.slug || ''}
                  disabled={saving}
                  key={activeWorkspace.slug}
                  placeholder="workspace-slug"
                  ref={slugInputRef}
                  style={{ width: 300 }}
                  variant="filled"
                  onBlur={handleSaveSlug}
                  onPressEnter={handleSaveSlug}
                />
              </Flexbox>
            </Flexbox>
          </Flexbox>
        </Flexbox>
        <Flexbox gap={8} style={{ padding: '16px 0' }}>
          <TextArea
            defaultValue={activeWorkspace.description || ''}
            disabled={saving}
            key={activeWorkspace.description}
            placeholder="Workspace description..."
            ref={descInputRef}
            rows={3}
            variant="filled"
            onBlur={handleSaveDescription}
          />
        </Flexbox>
      </FormGroup>
    </>
  );
};

export default WorkspaceGeneral;
