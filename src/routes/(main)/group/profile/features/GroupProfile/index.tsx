'use client';

import { ActionIcon, Button, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { confirmModal, type ModalInstance } from '@lobehub/ui/base-ui';
import { Divider } from 'antd';
import { useTheme } from 'antd-style';
import { Eye, EyeOff, MoreHorizontalIcon, PlayIcon, Settings2Icon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import urlJoin from 'url-join';

import { useAgentGroupTransferMenuItem } from '@/business/client/hooks/useAgentGroupTransferMenuItem';
import { EditingIndicator, type EditLockClient, useEditLock } from '@/features/EditLock';
import { EditorCanvas } from '@/features/EditorCanvas';
import { message } from '@/components/AntdStaticMethods';
import { usePermission } from '@/hooks/usePermission';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { useClientDataSWR } from '@/libs/swr';
import { officialGroupKeys } from '@/libs/swr/keys';
import { lambdaClient } from '@/libs/trpc/client';
import { useAgentGroupStore } from '@/store/agentGroup';
import { agentGroupSelectors } from '@/store/agentGroup/selectors';
import { useGroupProfileStore } from '@/store/groupProfile';
import { officialGroupService } from '@/services/officialGroup';

import { openGroupAgentSettingsModal } from '../AgentSettings';
import AutoSaveHint from '../Header/AutoSaveHint';
import GroupForkTag from './GroupForkTag';
import GroupHeader from './GroupHeader';
import GroupStatusTag from './GroupStatusTag';
import GroupVersionReviewTag from './GroupVersionReviewTag';

// Stable lock RPC binding for the chatGroup resource.
const groupLockClient: EditLockClient = {
  acquire: (id) => lambdaClient.group.acquireGroupLock.mutate({ id }),
  peek: (id) => lambdaClient.group.getGroupLock.query({ id }),
  release: async (id) => {
    await lambdaClient.group.releaseGroupLock.mutate({ id });
  },
};

const GroupProfile = memo(() => {
  const { t } = useTranslation(['setting', 'chat']);
  const { allowed: canEdit } = usePermission('edit_own_content');
  const { allowed: canPublishGroup } = usePermission('publish_group');
  const theme = useTheme();
  const { gid } = useParams<{ gid: string }>();
  const groupId = gid;
  const currentGroup = useAgentGroupStore((s) => agentGroupSelectors.getGroupById(gid ?? '')(s));
  const updateGroup = useAgentGroupStore((s) => s.updateGroup);
  const router = useQueryRoute();
  const transferMenuItems = useAgentGroupTransferMenuItem(groupId ?? undefined);

  const [isOfficial, setIsOfficial] = useState(false);
  const { data: isOfficialData, mutate: mutateIsOfficial } = useClientDataSWR(
    groupId ? officialGroupKeys.isOfficial(groupId) : null,
    () => (groupId ? officialGroupService.isOfficialGroup(groupId) : Promise.resolve(false)),
  );

  useEffect(() => {
    setIsOfficial(!!isOfficialData);
  }, [isOfficialData]);

  const handlePublishToDiscover = useCallback(() => {
    if (!groupId) return;
    confirmModal({
      title: t('marketPublish.confirm.publish.title', { defaultValue: '发布到发现页' }),
      content: t('marketPublish.confirm.publish.content', {
        defaultValue: '确定要将此群组发布到发现页吗？发布后所有用户都可以看到和使用。',
      }),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await officialGroupService.publishAsOfficialGroup(groupId);
          message.success(t('marketPublish.success.publish', { defaultValue: '发布成功' }));
          mutateIsOfficial();
        } catch (error) {
          message.error(t('marketPublish.error.publish', { defaultValue: '发布失败' }));
        }
      },
    });
  }, [groupId, mutateIsOfficial, t]);

  const handleUnpublishFromDiscover = useCallback(() => {
    if (!groupId) return;
    confirmModal({
      title: t('marketPublish.confirm.unpublish.title', { defaultValue: '取消发布' }),
      content: t('marketPublish.confirm.unpublish.content', {
        defaultValue: '确定要取消发布此群组吗？取消后其他用户将无法在发现页看到。',
      }),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await officialGroupService.unpublishOfficialGroup(groupId);
          message.success(t('marketPublish.success.unpublish', { defaultValue: '取消发布成功' }));
          mutateIsOfficial();
        } catch (error) {
          message.error(t('marketPublish.error.unpublish', { defaultValue: '取消发布失败' }));
        }
      },
    });
  }, [groupId, mutateIsOfficial, t]);

  const settingsModalRef = useRef<ModalInstance | null>(null);
  useEffect(
    () => () => {
      settingsModalRef.current?.close();
      settingsModalRef.current = null;
    },
    [],
  );

  // Collaborative edit lock for workspace groups (same model as pages): read-only
  // when another member is editing; acquired implicitly on the first edit.
  const [edited, setEdited] = useState(false);
  const groupIdRef = useRef(groupId);
  if (groupIdRef.current !== groupId) {
    groupIdRef.current = groupId;
    setEdited(false);
  }
  const lock = useEditLock({
    client: groupLockClient,
    // Only workspace groups lock — personal (non-workspace) groups stay fully
    // editable with no peek/pending, matching the server's workspace gating.
    enabled: Boolean(groupId && canEdit && currentGroup?.workspaceId),
    isDirty: edited,
    resourceId: groupId ?? undefined,
  });
  // Read-only until the lock resolves, so the user can't start typing on a group
  // that turns out to be locked and get bounced mid-edit.
  const editable = canEdit && !lock.lockedByOther && !lock.pending;

  const editor = useGroupProfileStore((s) => s.editor);
  const handleContentChange = useGroupProfileStore((s) => s.handleContentChange);
  const agentBuilderContentUpdate = useGroupProfileStore((s) => s.agentBuilderContentUpdate);
  const setAgentBuilderContent = useGroupProfileStore((s) => s.setAgentBuilderContent);

  // Create save callback that captures latest groupId
  const saveContent = useCallback(
    async (payload: { content: string; editorData: Record<string, any> }) => {
      if (!canEdit) return;
      if (!groupId) return;
      await updateGroup(groupId, {
        content: payload.content,
        editorData: payload.editorData,
      });
    },
    [canEdit, updateGroup, groupId],
  );

  const onContentChange = useCallback(() => {
    if (!editable) return;

    setEdited(true);
    handleContentChange(saveContent);
  }, [editable, handleContentChange, saveContent]);

  // Stabilize editorData object reference to prevent unnecessary re-renders
  const editorData = useMemo(
    () => ({
      content: currentGroup?.content ?? undefined,
      editorData: currentGroup?.editorData,
    }),
    [currentGroup?.content, currentGroup?.editorData],
  );

  // Watch for agent builder content updates and apply them directly to the editor
  useEffect(() => {
    if (!editor || !agentBuilderContentUpdate || !groupId) return;
    if (agentBuilderContentUpdate.entityId !== groupId) return;

    // Directly set the editor content
    editor.setDocument('markdown', agentBuilderContentUpdate.content);

    // Clear the update after processing to prevent re-applying
    setAgentBuilderContent('', '');
  }, [editor, agentBuilderContentUpdate, groupId, setAgentBuilderContent]);

  return (
    <>
      <Flexbox
        style={{ cursor: 'default', marginBottom: 12 }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Flexbox height={66} width={'100%'}>
          <Flexbox horizontal align={'center'} gap={8} paddingBlock={12}>
            <AutoSaveHint />
            <GroupStatusTag />
            <GroupVersionReviewTag />
            <GroupForkTag />
          </Flexbox>
        </Flexbox>
        {/* Header: Group Avatar + Title */}
        <GroupHeader />
        {/* Start Conversation Button */}
        <Flexbox
          horizontal
          align={'center'}
          gap={8}
          justify={'flex-start'}
          style={{ marginTop: 16 }}
        >
          <Button
            icon={PlayIcon}
            type={'primary'}
            onClick={() => {
              if (!groupId) return;
              router.push(urlJoin('/group', groupId));
            }}
          >
            {t('startConversation')}
          </Button>
          {canPublishGroup &&
            groupId &&
            (isOfficial ? (
              <Button
                danger
                icon={<Icon icon={EyeOff} />}
                size={'small'}
                type={'text'}
                onClick={handleUnpublishFromDiscover}
              >
                {t('marketPublish.action.unpublish', { defaultValue: '取消发布到发现页' })}
              </Button>
            ) : (
              <Button
                icon={<Icon icon={Eye} />}
                size={'small'}
                style={{ color: theme.colorTextSecondary }}
                type={'text'}
                onClick={handlePublishToDiscover}
              >
                {t('marketPublish.action.publish', { defaultValue: '发布到发现页' })}
              </Button>
            ))}
          {!!transferMenuItems?.length && (
            <DropdownMenu items={transferMenuItems}>
              <ActionIcon
                icon={MoreHorizontalIcon}
                size={'small'}
                style={{ color: theme.colorTextSecondary }}
              />
            </DropdownMenu>
          )}
          <Button
            disabled={!canEdit}
            icon={Settings2Icon}
            size={'small'}
            style={{ color: theme.colorTextSecondary }}
            type={'text'}
            onClick={() => {
              if (!canEdit) return;

              settingsModalRef.current?.close();
              settingsModalRef.current = openGroupAgentSettingsModal();
            }}
          >
            {t('advancedSettings')}
          </Button>
        </Flexbox>
      </Flexbox>
      <Divider />
      {/* Group Content Editor */}
      <EditingIndicator
        holderId={lock.lockedByOther ? lock.holderId : null}
        pending={canEdit && lock.pending}
      />
      <EditorCanvas
        disabled={!canEdit}
        editable={!lock.lockedByOther && !lock.pending}
        editor={editor}
        editorData={editorData}
        entityId={groupId}
        placeholder={t('group.profile.contentPlaceholder', { ns: 'chat' })}
        onContentChange={onContentChange}
      />
    </>
  );
});

export default GroupProfile;
