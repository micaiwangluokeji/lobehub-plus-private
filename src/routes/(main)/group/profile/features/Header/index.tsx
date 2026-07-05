'use client';

import { ActionIcon, DropdownMenu, Flexbox, Icon, Tag, type MenuProps } from '@lobehub/ui';
import { confirmModal } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import { Crown, MoreHorizontal, Rocket, Sparkles, Users, UsersRound } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { message } from '@/components/AntdStaticMethods';
import { DESKTOP_HEADER_ICON_SMALL_SIZE } from '@/const/layoutTokens';
import ToggleLeftPanelButton from '@/features/NavPanel/ToggleLeftPanelButton';
import { usePermission } from '@/hooks/usePermission';
import { parseAsString, useQueryState } from '@/hooks/useQueryParam';
import { useClientDataSWR } from '@/libs/swr';
import { officialGroupKeys } from '@/libs/swr/keys';
import AddGroupMemberModal from '@/routes/(main)/group/_layout/Sidebar/AddGroupMemberModal';
import { officialGroupService } from '@/services/officialGroup';
import { useAgentGroupStore } from '@/store/agentGroup';
import { agentGroupSelectors } from '@/store/agentGroup/selectors';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

import AgentBuilderToggle from './AgentBuilderToggle';
import { type ChromeTabItem } from './ChromeTabs';
import ChromeTabs from './ChromeTabs';

const styles = createStaticStyles(({ css, cssVar }) => ({
  header: css`
    overflow: hidden;
    flex: none;

    width: 100%;
    height: 44px;
    padding-block: 8px;
    padding-inline: 12px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
  tabsWrapper: css`
    scrollbar-width: none;
    overflow-x: auto;
    flex: 1;
    min-width: 0;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
}));

const Header = memo(() => {
  const { t } = useTranslation(['chat', 'setting', 'discover']);
  const { allowed: canEdit, reason } = usePermission('edit_own_content');
  const { allowed: canPublish, hasPermission } = usePermission('publish_group');
  // super_admin holds `group:publish:all`; VIP holds `group:publish:owner`.
  const isAdmin = hasPermission('group:publish:all');
  const isVIP = hasPermission('group:publish:owner');

  const [showAddModal, setShowAddModal] = useState(false);

  const { gid } = useParams<{ gid: string }>();
  const members = useAgentGroupStore((s) => agentGroupSelectors.getGroupAgents(gid ?? '')(s));
  const activeGroupId = useAgentGroupStore(agentGroupSelectors.activeGroupId);
  const addAgentsToGroup = useAgentGroupStore((s) => s.addAgentsToGroup);
  const createAgentInGroup = useAgentGroupStore((s) => s.createAgentInGroup);
  const showLeftPanel = useGlobalStore(systemStatusSelectors.showLeftPanel);

  const { data: isOfficial, mutate: refreshIsOfficial } = useClientDataSWR(
    canPublish && activeGroupId ? officialGroupKeys.isOfficial(activeGroupId) : null,
    () => officialGroupService.isOfficialGroup(activeGroupId!),
  );

  const { data: isPendingReview, mutate: refreshIsPendingReview } = useClientDataSWR(
    canPublish && activeGroupId ? officialGroupKeys.isPendingReview(activeGroupId) : null,
    () => officialGroupService.isPendingReview(activeGroupId!),
  );

  const handlePublishAsOfficial = useCallback(() => {
    if (!activeGroupId) return;
    confirmModal({
      okButtonProps: { type: 'primary' },
      onOk: async () => {
        try {
          await officialGroupService.publishAsOfficialGroup(activeGroupId);
          await refreshIsOfficial();
          await refreshIsPendingReview();
          // Admins publish/update directly; VIPs go through review.
          const successKey = isAdmin
            ? isOfficial
              ? 'publish.updateSuccess'
              : 'publish.publishSuccess'
            : 'publish.submitSuccess';
          message.success(t(successKey, { ns: 'discover' }));
        } catch (error: any) {
          console.error('Failed to publish group as official:', error);
          const errMsg = error?.data?.message || error?.message || t('publish.publishFailed', { ns: 'discover' });
          message.error(`发布失败: ${errMsg}`);
        }
      },
      title: t('settingGroup.discover.publishConfirm', { ns: 'setting' }),
    });
  }, [activeGroupId, refreshIsOfficial, refreshIsPendingReview, isAdmin, isOfficial, t]);

  const handleUnpublishOfficial = useCallback(() => {
    if (!activeGroupId) return;
    confirmModal({
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await officialGroupService.unpublishOfficialGroup(activeGroupId);
          await refreshIsOfficial();
          await refreshIsPendingReview();
          message.success(t('publish.unpublishSuccess', { ns: 'discover' }));
        } catch (error) {
          console.error('Failed to unpublish official group:', error);
          message.error(t('settingGroup.discover.unpublishFailed', { ns: 'setting' }));
        }
      },
      title: t('settingGroup.discover.unpublishConfirm', { ns: 'setting' }),
    });
  }, [activeGroupId, refreshIsOfficial, refreshIsPendingReview, t]);

  // Use URL query param for selected tab
  const [selectedTabId, setSelectedTabId] = useQueryState(
    'tab',
    parseAsString.withDefault('group'),
  );

  const existingMemberIds = useMemo(() => members.map((a) => a.id), [members]);

  const tabItems = useMemo<ChromeTabItem[]>(() => {
    const items: ChromeTabItem[] = [
      {
        icon: <Users size={16} />,
        id: 'group',
        title: t('group.profile.groupSettings'),
      },
    ];

    // Add agent tabs
    for (const agent of members) {
      items.push({
        avatar: agent.isSupervisor ? undefined : agent.avatar || undefined,
        icon: agent.isSupervisor ? <Crown size={16} /> : undefined,
        id: agent.id,
        isExternal: !agent.isSupervisor && !agent.virtual,
        title: agent.isSupervisor ? t('group.profile.supervisor') : agent.title || 'Untitled Agent',
      });
    }

    return items;
  }, [members, t]);

  const handleAddMembers = async (agentIds: string[]) => {
    if (!activeGroupId) return;
    await addAgentsToGroup(activeGroupId, agentIds);
    setShowAddModal(false);
  };

  const handleCreateMember = async () => {
    if (!activeGroupId) return;
    const newAgentId = await createAgentInGroup(activeGroupId, {
      title: t('group.profile.addMember.newMemberTitle'),
    });
    // Jump to the newly created member so the user can configure it right away
    if (newAgentId) setSelectedTabId(newAgentId);
  };

  const addMenuItems = useMemo<MenuProps['items']>(
    () => [
      {
        icon: <Icon icon={Sparkles} />,
        key: 'create-new',
        label: t('group.profile.addMember.createNew'),
        onClick: handleCreateMember,
      },
      {
        icon: <Icon icon={UsersRound} />,
        key: 'add-existing',
        label: t('group.profile.addMember.addExisting'),
        onClick: () => setShowAddModal(true),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeGroupId, t],
  );

  const moreMenuItems = useMemo(() => {
    if (!canPublish) return [];

    const items: MenuProps['items'] = [];

    if (isAdmin) {
      if (isOfficial) {
        items.push(
          {
            icon: <Icon icon={Rocket} />,
            key: 'update-official',
            label: t('publish.updateToDiscover', { ns: 'discover' }),
            onClick: handlePublishAsOfficial,
          },
          {
            danger: true,
            icon: <Icon icon={Rocket} />,
            key: 'unpublish-official',
            label: t('publish.unpublish', { ns: 'discover' }),
            onClick: handleUnpublishOfficial,
          },
        );
      } else {
        items.push({
          icon: <Icon icon={Rocket} />,
          key: 'publish-official',
          label: t('publish.publishToDiscover', { ns: 'discover' }),
          onClick: handlePublishAsOfficial,
        });
      }
    } else if (isVIP) {
      if (isOfficial) {
        items.push(
          {
            icon: <Icon icon={Rocket} />,
            key: 'submit-update-review',
            label: t('publish.submitUpdateReview', { ns: 'discover' }),
            onClick: handlePublishAsOfficial,
          },
          {
            danger: true,
            icon: <Icon icon={Rocket} />,
            key: 'unpublish-official',
            label: t('publish.unpublish', { ns: 'discover' }),
            onClick: handleUnpublishOfficial,
          },
        );
      } else {
        items.push({
          icon: <Icon icon={Rocket} />,
          key: 'submit-for-review',
          label: t('publish.submitForReview', { ns: 'discover' }),
          onClick: handlePublishAsOfficial,
        });
      }
    }

    return items;
  }, [
    canPublish,
    isAdmin,
    isOfficial,
    isVIP,
    handlePublishAsOfficial,
    handleUnpublishOfficial,
    t,
  ]);

  return (
    <>
      <Flexbox horizontal align="center" className={styles.header} gap={4} justify="space-between">
        {!showLeftPanel && <ToggleLeftPanelButton />}
        <div className={styles.tabsWrapper}>
          <ChromeTabs
            activeId={selectedTabId}
            addDisabled={!canEdit}
            addDisabledReason={reason}
            addMenuItems={addMenuItems}
            items={tabItems}
            onChange={setSelectedTabId}
          />
        </div>
        <Flexbox horizontal align="center" flex="none" gap={8} style={{ marginInlineStart: 12 }}>
          {isPendingReview && (
            <Tag bordered={false} color="orange">
              {t('publish.waitingForReview', { ns: 'discover' })}
            </Tag>
          )}
          {canPublish && moreMenuItems.length > 0 && (
            <DropdownMenu items={moreMenuItems}>
              <ActionIcon icon={MoreHorizontal} size={DESKTOP_HEADER_ICON_SMALL_SIZE} />
            </DropdownMenu>
          )}
          <AgentBuilderToggle />
        </Flexbox>
      </Flexbox>
      {activeGroupId && (
        <AddGroupMemberModal
          existingMembers={existingMemberIds}
          groupId={activeGroupId}
          open={showAddModal}
          onCancel={() => setShowAddModal(false)}
          onConfirm={handleAddMembers}
        />
      )}
    </>
  );
});

export default Header;
