'use client';

import { Avatar, Block, Button, Flexbox, Grid, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { App } from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import PublishedTime from '@/components/PublishedTime';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { type OfficialGroupItem, officialGroupService } from '@/services/officialGroup';

const styles = createStaticStyles(({ css, cssVar }) => ({
  card: css`
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    border-radius: 12px;
    overflow: hidden;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset-block-start: 0;
      inset-inline: 0;
      height: 3px;
      background: linear-gradient(90deg, ${cssVar.colorPrimary}, ${cssVar.colorSuccess});
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      border-color: ${cssVar.colorPrimary};
      transform: translateY(-4px);
      box-shadow: ${cssVar.boxShadowTertiary};
    }
  `,
  cardContent: css`
    position: relative;
    z-index: 1;
  `,
  desc: css`
    flex: 1;
    margin: 0 !important;

    color: ${cssVar.colorTextSecondary};
    line-height: 1.6;
  `,
  footer: css`
    margin-block-start: 16px;
    border-block-start: 1px solid ${cssVar.colorBorder};

    background: ${cssVar.colorBgContainer};
    border-radius: 0 0 12px 12px;
  `,
  header: css`
    position: relative;
  `,
  avatarWrapper: css`
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 12px;
      background: linear-gradient(135deg, ${cssVar.colorPrimary}20, ${cssVar.colorSuccess}20);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover::after {
      opacity: 1;
    }
  `,
  secondaryDesc: css`
    font-size: 12px;
    color: ${cssVar.colorTextDescription};

    display: flex;
    align-items: center;
    gap: 4px;
  `,
  title: css`
    margin: 0 !important;

    font-size: 16px !important;
    font-weight: 600 !important;
    color: ${cssVar.colorText};
    transition: color 0.2s ease;

    &:hover {
      color: ${cssVar.colorPrimary};
    }
  `,
  useButton: css`
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  `,
}));

interface OfficialGroupCardProps {
  group: OfficialGroupItem;
  mobile?: boolean;
}

const OfficialGroupCard = memo<OfficialGroupCardProps>(({ group, mobile }) => {
  const { t } = useTranslation('discover');
  const { message } = App.useApp();
  const navigate = useWorkspaceAwareNavigate();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUse = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const result = await officialGroupService.installOfficialGroup(group.groupId);

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

  const handleCardClick = () => {
    nav(`/discover/group/${group.groupId}`);
  };

  return (
    <Block
      className={styles.card}
      height={'100%'}
      variant={'outlined'}
      width={'100%'}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={handleCardClick}
    >
      <Flexbox
        className={styles.cardContent}
        flex={1}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <Flexbox horizontal align={'flex-start'} gap={12} padding={16} width={'100%'}>
          <div className={styles.avatarWrapper}>
            <Avatar
              avatar={group.avatar}
              background={group.backgroundColor || 'transparent'}
              shape={'square'}
              size={48}
              style={{ flex: 'none' }}
            />
          </div>
          <Flexbox flex={1} gap={6} style={{ overflow: 'hidden' }}>
            <Text ellipsis as={'h2'} className={styles.title}>
              {group.title}
            </Text>
            <Text
              as={'p'}
              className={styles.desc}
              ellipsis={{
                rows: 2,
              }}
            >
              {group.description}
            </Text>
          </Flexbox>
        </Flexbox>
        <Flexbox
          horizontal
          align={'center'}
          className={styles.footer}
          justify={'space-between'}
          padding={16}
          style={{ marginTop: 'auto' }}
        >
          <Flexbox horizontal align={'center'} gap={8} className={styles.secondaryDesc}>
            {group.memberCount > 0 && (
              <span className={styles.memberCount}>
                {t('groupAgents.tag')} · {group.memberCount}
              </span>
            )}
            {group.updatedAt && (
              <PublishedTime date={group.updatedAt.toISOString()} template={'MMM DD, YYYY'} />
            )}
          </Flexbox>
          <Button
            className={styles.useButton}
            loading={loading}
            size={'small'}
            type={'primary'}
            onClick={handleUse}
          >
            {t('officialGroup.install')}
          </Button>
        </Flexbox>
      </Flexbox>
    </Block>
  );
});

export interface OfficialGroupListProps {
  data?: OfficialGroupItem[];
  mobile?: boolean;
  rows?: number;
}

const AgentGroupList = memo<OfficialGroupListProps>(({ data = [], mobile }) => {
  const { t } = useTranslation('discover');

  if (data.length === 0) {
    return (
      <Flexbox
        align={'center'}
        justify={'center'}
        style={{ padding: '120px 0', textAlign: 'center' }}
        width={'100%'}
      >
        <Text type={'secondary'} style={{ fontSize: 16 }}>
          {t('groupAgents.empty')}
        </Text>
      </Flexbox>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        width: '100%',
      }}
    >
      {data.map((group) => (
        <OfficialGroupCard key={group.groupId} group={group} mobile={mobile} />
      ))}
    </div>
  );
});

export default AgentGroupList;
