'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { withSuspense } from '@/components/withSuspense';
import { useQuery } from '@/hooks/useQuery';
import { useClientDataSWR } from '@/libs/swr';
import { officialAgentKeys } from '@/libs/swr/keys';
import { officialAgentService } from '@/services/officialAgent';
import { DiscoverTab } from '@/types/discover';

import Pagination from '../features/Pagination';
import OfficialAgentList from './features/OfficialList';
import Loading from './loading';

const Client = memo<{ mobile?: boolean }>(({ mobile }) => {
  const { q, page } = useQuery() as { q?: string; page?: number };
  const currentPage = page ? Number(page) : 1;

  const { data, isLoading } = useClientDataSWR(
    officialAgentKeys.list(q, currentPage, 21),
    () => officialAgentService.getOfficialAgents({ keyword: q, page: currentPage, pageSize: 21 }),
  );

  if (isLoading || !data) return <Loading />;

  return (
    <Flexbox gap={32} width={'100%'}>
      <OfficialAgentList data={data.items} mobile={mobile} />
      <Pagination
        currentPage={data.page}
        pageSize={data.pageSize}
        tab={DiscoverTab.Assistants}
        total={data.totalCount}
      />
    </Flexbox>
  );
});

export default withSuspense(Client);
