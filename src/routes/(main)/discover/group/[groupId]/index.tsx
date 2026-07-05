'use client';

import { Avatar, Block, Button, Collapse, Flexbox, Grid, Icon, Tag, Text, Tooltip, TooltipGroup } from '@lobehub/ui';
import { createStaticStyles, cssVar, useResponsive } from 'antd-style';
import { App } from 'antd';
import { ArrowLeftIcon, Crown, UsersIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import PublishedTime from '@/components/PublishedTime';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { officialGroupKeys } from '@/libs/swr/keys';
import { officialGroupService } from '@/services/officialGroup';

import Loading from './loading';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
  `,
  desc: css`
    color: ${cssVar.colorTextSecondary};
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  `,
  memberDesc: css`
    flex: 1;
    margin: 0 !important;
    color: ${cssVar.colorTextSecondary};
    font-size: 13px;
    line-height: 1.5;
  `,
  memberMeta: css`
    color: ${cssVar.colorTextDescription};
    font-size: 12px;
  `,
  memberTitle: css`
    margin: 0 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
  `,
  sectionTitle: css`
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  `,
  title: css`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  `,
}));

const MemberCard = memo<{ member: any }>(({ member }) => {
  const { t } = useTranslation('discover');
  // The official group API returns each member as { agent, role, order, enabled }.
  // Support both the nested structure and a flat agent object for safety.
  const agent = member?.agent || member;
  const role: string | undefined = member?.role || agent?.role;
  const isSupervisor = role === 'supervisor';

  return (
    <Block
      height={'100%'}
      variant={'outlined'}
      width={'100%'}
      style={{
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      <Flexbox gap={12} padding={16}>
        <Flexbox horizontal align={'flex-start'} gap={12}>
          <Avatar
            avatar={agent.avatar || agent.title?.[0]}
            background={agent.backgroundColor || 'transparent'}
            shape={'square'}
            size={40}
            style={{ flex: 'none' }}
          />
          <Flexbox flex={1} gap={4} style={{ overflow: 'hidden' }}>
            <Flexbox horizontal align={'center'} gap={6}>
              <Text ellipsis as={'h3'} className={styles.memberTitle}>
                {agent.title}
              </Text>
              {isSupervisor && (
                <Tag bordered={false} color={'gold'} icon={<Crown size={12} />}>
                  {t('members.supervisor', { defaultValue: 'Supervisor' })}
                </Tag>
              )}
            </Flexbox>
          </Flexbox>
        </Flexbox>

        {agent.description && (
          <Text
            as={'p'}
            className={styles.memberDesc}
            ellipsis={{
              rows: 2,
            }}
          >
            {agent.description}
          </Text>
        )}

        {(agent.provider || agent.model) && (
          <Text className={styles.memberMeta}>
            {[agent.provider, agent.model].filter(Boolean).join(' / ')}
          </Text>
        )}
      </Flexbox>
    </Block>
  );
});

MemberCard.displayName = 'MemberCard';

const DiscoverGroupDetailPage = memo(() => {
  const { t } = useTranslation('discover');
  const { message } = App.useApp();
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId || '';
  const navigate = useWorkspaceAwareNavigate();
  const nav = useNavigate();
  const { mobile } = useResponsive();
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useOnlyFetchOnceSWR(
    officialGroupKeys.detail(groupId),
    () => officialGroupService.getOfficialGroup(groupId),
    {
      fallbackData: null,
    },
  );

  if (isLoading) return <Loading />;
  if (!data?.group) return <div style={{ padding: 80, textAlign: 'center' }}>专家团不存在</div>;

  const group = data.group;
  const agents: any[] = data.agents || [];
  const memberCount = (group as any).memberCount ?? agents.length;

  // Sort members: supervisors first, then by display order.
  const sortedMembers = [...agents].sort((a, b) => {
    const aRole = a?.role || a?.agent?.role;
    const bRole = b?.role || b?.agent?.role;
    if (aRole === 'supervisor' && bRole !== 'supervisor') return -1;
    if (aRole !== 'supervisor' && bRole === 'supervisor') return 1;
    const aOrder = a?.order ?? a?.agent?.order ?? 0;
    const bOrder = b?.order ?? b?.agent?.order ?? 0;
    return aOrder - bOrder;
  });

  const handleUse = async () => {
    try {
      setLoading(true);
      const result = await officialGroupService.installOfficialGroup(groupId);

      if (result.alreadyInstalled) {
        message.info(t('officialAgent.alreadyInstalled'));
      } else {
        message.success(t('officialAgent.installSuccess'));
      }

      navigate(`/group/${result.groupId}`);
    } catch (error) {
      console.error('Install official group failed:', error);
      message.error(t('officialAgent.installFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    nav('/discover/agent');
  };

  return (
    <Flexbox className={styles.container} gap={16} width={'100%'}>
      <Button
        icon={<Icon icon={ArrowLeftIcon} />}
        onClick={handleBack}
        variant={'outlined'}
        style={{ alignSelf: 'flex-start' }}
      >
        {t('groupAgents.tag', { defaultValue: 'Group' })}
      </Button>

      {/* Header — community-style: avatar, title, description, member count, use button */}
      <Flexbox gap={12}>
        <Flexbox horizontal align={'flex-start'} gap={16} width={'100%'}>
          <Avatar
            avatar={group.avatar || group.title?.[0]}
            background={group.backgroundColor || 'transparent'}
            shape={'square'}
            size={mobile ? 48 : 64}
          />
          <Flexbox flex={1} gap={4} style={{ overflow: 'hidden' }}>
            <Text ellipsis as={'h1'} className={styles.title} title={group.title ?? undefined}>
              {group.title}
            </Text>
            {group.description && (
              <Text as={'p'} className={styles.desc}>
                {group.description}
              </Text>
            )}
            <TooltipGroup>
              <Flexbox
                horizontal
                align={'center'}
                gap={mobile ? 12 : 24}
                wrap={'wrap'}
                style={{ color: cssVar.colorTextSecondary }}
              >
                {Boolean(memberCount) && (
                  <Tooltip
                    styles={{ root: { pointerEvents: 'none' } }}
                    title={t('groupAgents.memberCount', { defaultValue: 'Members' })}
                  >
                    <Flexbox horizontal align={'center'} gap={6}>
                      <Icon icon={UsersIcon} />
                      {memberCount}
                    </Flexbox>
                  </Tooltip>
                )}
                {group.updatedAt && (
                  <PublishedTime
                    className={styles.memberMeta}
                    date={group.updatedAt.toISOString()}
                    template={'MMM DD, YYYY'}
                  />
                )}
              </Flexbox>
            </TooltipGroup>
            <Button
              loading={loading}
              type={'primary'}
              onClick={handleUse}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            >
              {t('officialAgent.use')}
            </Button>
          </Flexbox>
        </Flexbox>
      </Flexbox>

      {/* Overview — group summary + member list (no system prompts) */}
      <Flexbox gap={16}>
        <Collapse
          defaultActiveKey={['summary']}
          expandIconPlacement={'end'}
          variant={'outlined'}
          items={[
            {
              children: group.description || group.title,
              key: 'summary',
              label: t('groupAgents.details.summary.title', { defaultValue: 'Summary' }),
            },
          ]}
        />

        {sortedMembers.length > 0 && (
          <>
            <Flexbox horizontal align={'center'} gap={8}>
              <Text as={'h2'} className={styles.sectionTitle}>
                {t('groupAgents.details.members.title', { defaultValue: 'Member Agents' })}
              </Text>
              <Text className={styles.memberMeta}>· {sortedMembers.length}</Text>
            </Flexbox>
            <Grid rows={4} width={'100%'}>
              {sortedMembers.map((member, index) => {
                const agent = member?.agent || member;
                return <MemberCard key={agent.id || index} member={member} />;
              })}
            </Grid>
          </>
        )}
      </Flexbox>
    </Flexbox>
  );
});

export default DiscoverGroupDetailPage;
