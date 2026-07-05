'use client';

import { AGENT_CHAT_URL } from '@lobechat/const';
import { Avatar, Block, Button, Flexbox, Grid, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { App } from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PublishedTime from '@/components/PublishedTime';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { type OfficialAgentItem, officialAgentService } from '@/services/officialAgent';
import { useHomeStore } from '@/store/home';

import AssistantEmpty from '../../../../features/AssistantEmpty';

const styles = createStaticStyles(({ css, cssVar }) => ({
  desc: css`
    flex: 1;
    margin: 0 !important;
    color: ${cssVar.colorTextSecondary};
  `,
  footer: css`
    margin-block-start: 16px;
    border-block-start: 1px dashed ${cssVar.colorBorder};
    background: ${cssVar.colorBgContainer};
  `,
  secondaryDesc: css`
    font-size: 12px;
    color: ${cssVar.colorTextDescription};
  `,
  title: css`
    margin: 0 !important;
    font-size: 16px !important;
    font-weight: 500 !important;
  `,
}));

interface OfficialAgentCardProps {
  agent: OfficialAgentItem;
  mobile?: boolean;
}

const OfficialAgentCard = memo<OfficialAgentCardProps>(({ agent, mobile }) => {
  const { t } = useTranslation('discover');
  const { message } = App.useApp();
  const navigate = useWorkspaceAwareNavigate();
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const [loading, setLoading] = useState(false);

  const handleUse = async () => {
    try {
      setLoading(true);
      const result = await officialAgentService.installOfficialAgent(agent.agentId);
      await refreshAgentList();

      if (result.alreadyInstalled) {
        message.info(t('officialAgent.alreadyInstalled'));
      } else {
        message.success(t('officialAgent.installSuccess'));
      }

      navigate(AGENT_CHAT_URL(result.agentId, mobile));
    } catch (error) {
      console.error('Install official agent failed:', error);
      message.error(t('officialAgent.installFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Block height={'100%'} variant={'outlined'} width={'100%'} style={{ overflow: 'hidden' }}>
      <Flexbox horizontal align={'flex-start'} gap={12} padding={16} width={'100%'}>
        <Avatar
          avatar={agent.avatar}
          background={agent.backgroundColor || 'transparent'}
          shape={'square'}
          size={40}
          style={{ flex: 'none' }}
        />
        <Flexbox flex={1} gap={2} style={{ overflow: 'hidden' }}>
          <Text ellipsis as={'h2'} className={styles.title}>
            {agent.title}
          </Text>
          <Text
            as={'p'}
            className={styles.desc}
            ellipsis={{
              rows: 2,
            }}
          >
            {agent.description}
          </Text>
        </Flexbox>
      </Flexbox>
      <Flexbox
        horizontal
        align={'center'}
        className={styles.footer}
        justify={'space-between'}
        padding={16}
      >
        <Flexbox horizontal align={'center'} gap={4} className={styles.secondaryDesc}>
          {agent.updatedAt && (
            <PublishedTime
              className={styles.secondaryDesc}
              date={agent.updatedAt.toISOString()}
              template={'MMM DD, YYYY'}
            />
          )}
        </Flexbox>
        <Button loading={loading} size={'small'} type={'primary'} onClick={handleUse}>
          {t('officialAgent.use')}
        </Button>
      </Flexbox>
    </Block>
  );
});

export interface OfficialAgentListProps {
  data?: OfficialAgentItem[];
  mobile?: boolean;
  rows?: number;
}

const OfficialAgentList = memo<OfficialAgentListProps>(({ data = [], mobile, rows = 3 }) => {
  if (data.length === 0) return <AssistantEmpty />;

  return (
    <Grid rows={rows} width={'100%'}>
      {data.map((agent) => (
        <OfficialAgentCard key={agent.agentId} agent={agent} mobile={mobile} />
      ))}
    </Grid>
  );
});

export default OfficialAgentList;
