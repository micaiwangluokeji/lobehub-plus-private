'use client';

import { Flexbox } from '@lobehub/ui';
import { Tabs, type TabsItem } from '@lobehub/ui/base-ui';
import { createStaticStyles } from 'antd-style';
import { Pagination } from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { useQuery } from '@/hooks/useQuery';
import { useClientDataSWR } from '@/libs/swr';
import { officialAgentKeys } from '@/libs/swr/keys';
import { officialGroupKeys } from '@/libs/swr/keys';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { officialAgentService } from '@/services/officialAgent';
import { officialGroupService } from '@/services/officialGroup';

import AgentList from '@/features/Discover/AgentList';
import AgentGroupList from '@/features/Discover/AgentGroupList';
import Loading from './loading';

const styles = createStaticStyles(({ css, cssVar }) => {
  return {
    container: css`
      max-width: 1200px;
      margin-block: 0;
      margin-inline: auto;
      padding: 24px;

      @media (width <= 768px) {
        padding: 16px;
      }
    `,
    page: css`
      .ant-pagination-item-active {
        border-color: ${cssVar.colorPrimary};
        background: ${cssVar.colorPrimary};
        color: #fff;

        a {
          color: #fff;
        }

        &:hover {
          border-color: ${cssVar.colorPrimaryHover};
          background: ${cssVar.colorPrimaryHover};
        }
      }

      .ant-pagination-item:hover {
        border-color: ${cssVar.colorPrimary};
      }
    `,
    tabContainer: css`
      background: ${cssVar.colorBgContainer};

      border-radius: 12px;
      padding: 8px;
      box-shadow: ${cssVar.boxShadowSecondary};
      margin-block-end: 24px;
    `,
  };
});

enum DiscoverTab {
  Agent = 'agent',
  Group = 'group',
}

const SCROLL_PARENT_ID = 'lobe-scroll-container';

const DiscoverAgentPage = memo(() => {
  const { t } = useTranslation('discover');
  const { q, page } = useQuery() as { q?: string; page?: number };
  const currentPage = page ? Number(page) : 1;
  const navigate = useWorkspaceAwareNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<DiscoverTab>(DiscoverTab.Agent);

  const { data: agentData, isLoading: agentLoading } = useClientDataSWR(
    officialAgentKeys.list(q, currentPage, 21),
    () => officialAgentService.getOfficialAgents({ keyword: q, page: currentPage, pageSize: 21 }),
  );

  const { data: groupData, isLoading: groupLoading } = useClientDataSWR(
    officialGroupKeys.list(q, currentPage, 21),
    () => officialGroupService.getOfficialGroups({ keyword: q, page: currentPage, pageSize: 21 }),
  );

  const isLoading = activeTab === DiscoverTab.Agent ? agentLoading : groupLoading;
  const data = activeTab === DiscoverTab.Agent ? agentData : groupData;

  if (isLoading || !data) return <Loading />;

  const handlePageChange = (newPage: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', String(newPage));
    navigate(`/discover/agent?${searchParams.toString()}`);

    const scrollableElement = document?.querySelector(`#${SCROLL_PARENT_ID}`);
    if (!scrollableElement) return;
    scrollableElement.scrollTo({ behavior: 'smooth', top: 0 });
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabContainer}>
        <Tabs
          activeKey={activeTab}
          items={
            [
              {
                key: DiscoverTab.Agent,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
                    </svg>
                    {t('tab.expert')}
                  </span>
                ),
              },
              {
                key: DiscoverTab.Group,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
                    </svg>
                    {t('tab.expertTeam')}
                  </span>
                ),
              },
            ] as TabsItem[]
          }
          onChange={(key) => setActiveTab(key as DiscoverTab)}
        />
      </div>
      <Flexbox gap={24} style={{ marginTop: 24 }}>
        {activeTab === DiscoverTab.Agent ? (
          <>
            <AgentList data={agentData?.items} />
            <Pagination
              className={styles.page}
              current={agentData?.page ?? 1}
              pageSize={agentData?.pageSize ?? 21}
              showSizeChanger={false}
              total={agentData?.totalCount ?? 0}
              style={{ alignSelf: 'center' }}
              onChange={handlePageChange}
            />
          </>
        ) : (
          <>
            <AgentGroupList data={groupData?.items} />
            <Pagination
              className={styles.page}
              current={groupData?.page ?? 1}
              pageSize={groupData?.pageSize ?? 21}
              showSizeChanger={false}
              total={groupData?.totalCount ?? 0}
              style={{ alignSelf: 'center' }}
              onChange={handlePageChange}
            />
          </>
        )}
      </Flexbox>
    </div>
  );
});

export default DiscoverAgentPage;
