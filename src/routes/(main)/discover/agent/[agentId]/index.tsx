'use client';

import { BRANDING_NAME } from '@lobechat/business-const';
import { AGENT_CHAT_URL } from '@lobechat/const';
import { Avatar, Block, Button, Collapse, Flexbox, Icon, Tag, Text } from '@lobehub/ui';
import { ChatList } from '@lobehub/ui/chat';
import { createStaticStyles, cssVar, useResponsive, useTheme } from 'antd-style';
import { App } from 'antd';
import { ArrowLeftIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import PublishedTime from '@/components/PublishedTime';
import { DEFAULT_USER_AVATAR_URL } from '@/const/meta';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { officialAgentKeys } from '@/libs/swr/keys';
import { officialAgentService } from '@/services/officialAgent';
import { useHomeStore } from '@/store/home';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

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
  sectionTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  `,
  time: css`
    font-size: 12px;
    color: ${cssVar.colorTextDescription};
  `,
}));

const DiscoverAgentDetailPage = memo(() => {
  const { t } = useTranslation('discover');
  const { message } = App.useApp();
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId || '';
  const navigate = useWorkspaceAwareNavigate();
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { mobile } = useResponsive();

  const [userAvatar, username] = useUserStore((s) => [
    userProfileSelectors.userAvatar(s),
    userProfileSelectors.username(s),
  ]);
  const isSignedIn = useUserStore(authSelectors.isLogin);

  const { data, isLoading } = useOnlyFetchOnceSWR(
    officialAgentKeys.detail(agentId),
    () => officialAgentService.getOfficialAgent(agentId),
    {
      fallbackData: null,
    },
  );

  if (isLoading) return <Loading />;
  if (!data) {
    return (
      <Flexbox align={'center'} className={styles.container} padding={80} width={'100%'}>
        <Text style={{ color: cssVar.colorTextDescription }}>{t('officialAgent.notFound')}</Text>
      </Flexbox>
    );
  }

  const {
    title,
    description,
    avatar,
    backgroundColor,
    tags,
    fewShots,
    openingMessage,
    openingQuestions,
    updatedAt,
  } = data;

  const handleUse = async () => {
    try {
      setLoading(true);
      const result = await officialAgentService.installOfficialAgent(agentId);
      await refreshAgentList();

      if (result.alreadyInstalled) {
        message.info(t('officialAgent.alreadyInstalled'));
      } else {
        message.success(t('officialAgent.installSuccess'));
      }

      navigate(AGENT_CHAT_URL(result.agentId));
    } catch (error) {
      console.error('Install official agent failed:', error);
      message.error(t('officialAgent.installFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/discover/agent');
  };

  // Build example conversation: opening message first, then few-shots
  const fewShotsList = (fewShots as { content: string; role: string }[] | null) ?? [];
  const rawMessages: { content: string; role: string }[] = [];
  if (openingMessage) rawMessages.push({ content: openingMessage, role: 'assistant' });
  for (const shot of fewShotsList) {
    if (shot?.content) rawMessages.push({ content: shot.content, role: shot.role });
  }

  const chatData: any[] = rawMessages.map((item, index) => {
    let meta = {
      avatar: avatar ?? undefined,
      backgroundColor: backgroundColor || 'transparent',
      title: title ?? undefined,
    };
    if (item.role === 'user') {
      meta = {
        avatar: isSignedIn && userAvatar ? userAvatar : DEFAULT_USER_AVATAR_URL,
        backgroundColor: 'transparent',
        title: isSignedIn && username ? username : BRANDING_NAME,
      };
    }

    return {
      extra: {},
      id: index,
      ...item,
      meta,
    };
  });

  const hasChatData = chatData.length > 0;
  const questions = Array.isArray(openingQuestions) ? openingQuestions.filter(Boolean) : [];
  const hasTags = Array.isArray(tags) && tags.length > 0;

  return (
    <Flexbox className={styles.container} gap={24} width={'100%'}>
      <Button
        icon={<Icon icon={ArrowLeftIcon} />}
        onClick={handleBack}
        style={{ alignSelf: 'flex-start' }}
        variant={'outlined'}
      >
        {t('back')}
      </Button>

      <Flexbox gap={12}>
        <Flexbox horizontal align={'flex-start'} gap={mobile ? 12 : 24} width={'100%'}>
          <Avatar
            avatar={avatar ?? undefined}
            background={backgroundColor || 'transparent'}
            shape={'square'}
            size={mobile ? 64 : 80}
          />
          <Flexbox flex={1} gap={12} style={{ overflow: 'hidden' }}>
            <Text as={'h1'} style={{ fontSize: mobile ? 20 : 28, fontWeight: 600, margin: 0 }}>
              {title}
            </Text>
            {description && (
              <Text as={'p'} className={styles.desc}>
                {description}
              </Text>
            )}
            <Button
              loading={loading}
              style={{ alignSelf: 'flex-start' }}
              type={'primary'}
              onClick={handleUse}
            >
              {t('officialAgent.use')}
            </Button>
          </Flexbox>
        </Flexbox>
        {(hasTags || updatedAt) && (
          <Flexbox horizontal align={'center'} gap={8} wrap={'wrap'}>
            {hasTags &&
              tags!.map((tag, index) => (
                <Tag bordered={false} color="default" key={index}>
                  {tag}
                </Tag>
              ))}
            {updatedAt && (
              <PublishedTime className={styles.time} date={updatedAt.toISOString()} />
            )}
          </Flexbox>
        )}
      </Flexbox>

      <Flexbox gap={16}>
        <Collapse
          defaultActiveKey={['summary']}
          expandIconPlacement={'end'}
          items={[
            {
              children: description,
              key: 'summary',
              label: t('assistants.details.summary.title'),
            },
          ]}
          variant={'outlined'}
        />
        {hasChatData && (
          <>
            <h2 className={styles.sectionTitle}>{t('assistants.details.overview.example')}</h2>
            <Block
              style={{
                background: theme.colorBgContainerSecondary,
              }}
              variant={'outlined'}
            >
              <ChatList
                data={chatData}
                renderMessages={{
                  default: ({ id, editableContent }) => <div id={id}>{editableContent}</div>,
                }}
                style={{ width: '100%' }}
              />
            </Block>
          </>
        )}
        {questions.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>
              {t('assistants.details.systemRole.openingQuestions')}
            </h2>
            <Flexbox gap={8}>
              {questions.map((q, index) => (
                <Block key={index} style={{ padding: '12px 16px' }} variant={'outlined'}>
                  {q}
                </Block>
              ))}
            </Flexbox>
          </>
        )}
      </Flexbox>
    </Flexbox>
  );
});

export default DiscoverAgentDetailPage;
