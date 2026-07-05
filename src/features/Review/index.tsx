'use client';

import { Avatar, Flexbox, Text } from '@lobehub/ui';
import { Button, type TabsItem, Tabs } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { message } from '@/components/AntdStaticMethods';
import { usePermission } from '@/hooks/usePermission';
import { useClientDataSWR, mutate } from '@/libs/swr';
import { officialAgentKeys, officialGroupKeys } from '@/libs/swr/keys';
import { officialAgentService } from '@/services/officialAgent';
import { officialGroupService } from '@/services/officialGroup';

enum ReviewTab {
  Agent = 'agent',
  Group = 'group',
}

const styles = createStaticStyles(({ css, cssVar }) => ({
  item: css`
    padding: 16px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
    background: ${cssVar.colorBgContainer};
  `,
  meta: css`
    flex: 1;
    min-width: 0;
  `,
}));

const Review = memo(() => {
  const { t } = useTranslation('setting');
  const navigate = useNavigate();
  const { allowed: canReview } = usePermission('manage_official_agents');

  const [activeTab, setActiveTab] = useState<ReviewTab>(ReviewTab.Agent);

  // Permission guard — non-admins are redirected to home.
  useEffect(() => {
    if (!canReview) {
      navigate('/');
    }
  }, [canReview, navigate]);

  const { data: agentData, isLoading: agentLoading } = useClientDataSWR(
    canReview ? officialAgentKeys.pendingReviews() : null,
    () => officialAgentService.getPendingReviews(),
  );

  const { data: groupData, isLoading: groupLoading } = useClientDataSWR(
    canReview ? officialGroupKeys.pendingReviews() : null,
    () => officialGroupService.getPendingReviews(),
  );

  const handleApproveAgent = useCallback(
    async (agentId: string) => {
      try {
        await officialAgentService.approveReview(agentId);
        await mutate(officialAgentKeys.pendingReviews());
        message.success(t('review.approveSuccess'));
      } catch (error) {
        console.error('Failed to approve agent review:', error);
        message.error(String((error as any)?.message ?? error));
      }
    },
    [t],
  );

  const handleRejectAgent = useCallback(
    async (agentId: string) => {
      try {
        await officialAgentService.rejectReview(agentId);
        await mutate(officialAgentKeys.pendingReviews());
        message.success(t('review.rejectSuccess'));
      } catch (error) {
        console.error('Failed to reject agent review:', error);
        message.error(String((error as any)?.message ?? error));
      }
    },
    [t],
  );

  const handleApproveGroup = useCallback(
    async (groupId: string) => {
      try {
        await officialGroupService.approveReview(groupId);
        await mutate(officialGroupKeys.pendingReviews());
        message.success(t('review.approveSuccess'));
      } catch (error) {
        console.error('Failed to approve group review:', error);
        message.error(String((error as any)?.message ?? error));
      }
    },
    [t],
  );

  const handleRejectGroup = useCallback(
    async (groupId: string) => {
      try {
        await officialGroupService.rejectReview(groupId);
        await mutate(officialGroupKeys.pendingReviews());
        message.success(t('review.rejectSuccess'));
      } catch (error) {
        console.error('Failed to reject group review:', error);
        message.error(String((error as any)?.message ?? error));
      }
    },
    [t],
  );

  if (!canReview) return null;

  const agentItems = agentData?.items ?? [];
  const groupItems = groupData?.items ?? [];

  const renderEmpty = () => (
    <Flexbox align={'center'} style={{ padding: '80px 0', textAlign: 'center' }} width={'100%'}>
      {t('review.empty')}
    </Flexbox>
  );

  const renderAgentList = () => {
    if (agentLoading) return null;
    if (agentItems.length === 0) return renderEmpty();
    return (
      <Flexbox gap={12} width={'100%'}>
        {agentItems.map((item) => (
          <Flexbox align={'center'} className={styles.item} gap={12} horizontal key={item.agentId}>
            <Avatar
              avatar={item.avatar ?? undefined}
              background={item.backgroundColor ?? undefined}
              shape={'circle'}
              size={40}
            />
            <Flexbox className={styles.meta} gap={4}>
              <Text strong ellipsis>
                {item.title ?? item.agentId}
              </Text>
              <Flexbox gap={4} horizontal>
                <Text fontSize={12} type={'secondary'}>
                  {t('review.submitter')}:{' '}
                  {item.submitterFullName ?? item.submitterUsername ?? item.submitterId ?? '-'}
                </Text>
                <Text fontSize={12} type={'secondary'}>
                  ·
                </Text>
                <Text fontSize={12} type={'secondary'}>
                  {t('review.submitTime')}:{' '}
                  {item.submittedAt ? dayjs(item.submittedAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Text>
              </Flexbox>
            </Flexbox>
            <Flexbox gap={8} horizontal>
              <Button type={'primary'} onClick={() => handleApproveAgent(item.agentId)}>
                {t('review.approve')}
              </Button>
              <Button danger onClick={() => handleRejectAgent(item.agentId)}>
                {t('review.reject')}
              </Button>
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
    );
  };

  const renderGroupList = () => {
    if (groupLoading) return null;
    if (groupItems.length === 0) return renderEmpty();
    return (
      <Flexbox gap={12} width={'100%'}>
        {groupItems.map((item) => (
          <Flexbox align={'center'} className={styles.item} gap={12} horizontal key={item.groupId}>
            <Avatar
              avatar={item.avatar ?? undefined}
              background={item.backgroundColor ?? undefined}
              shape={'circle'}
              size={40}
            />
            <Flexbox className={styles.meta} gap={4}>
              <Text strong ellipsis>
                {item.title ?? item.groupId}
              </Text>
              <Flexbox gap={4} horizontal>
                <Text fontSize={12} type={'secondary'}>
                  {t('review.submitter')}:{' '}
                  {item.submitterFullName ?? item.submitterUsername ?? item.submitterId ?? '-'}
                </Text>
                <Text fontSize={12} type={'secondary'}>
                  ·
                </Text>
                <Text fontSize={12} type={'secondary'}>
                  {t('review.submitTime')}:{' '}
                  {item.submittedAt ? dayjs(item.submittedAt).format('YYYY-MM-DD HH:mm') : '-'}
                </Text>
              </Flexbox>
            </Flexbox>
            <Flexbox gap={8} horizontal>
              <Button type={'primary'} onClick={() => handleApproveGroup(item.groupId)}>
                {t('review.approve')}
              </Button>
              <Button danger onClick={() => handleRejectGroup(item.groupId)}>
                {t('review.reject')}
              </Button>
            </Flexbox>
          </Flexbox>
        ))}
      </Flexbox>
    );
  };

  return (
    <Flexbox gap={24} width={'100%'}>
      <Tabs
        activeKey={activeTab}
        items={
          [
            { key: ReviewTab.Agent, label: t('review.agentTab') },
            { key: ReviewTab.Group, label: t('review.groupTab') },
          ] as TabsItem[]
        }
        onChange={(key) => setActiveTab(key as ReviewTab)}
      />
      {activeTab === ReviewTab.Agent ? renderAgentList() : renderGroupList()}
    </Flexbox>
  );
});

export default Review;
