'use client';

import { isDesktop } from '@lobechat/const';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { SubscriptionIframeWrapper } from './SubscriptionIframeWrapper';

const PlanComparison = dynamic(() => import('@/features/Billing/PlanComparison'), { ssr: false });

const Plans = memo(() => {
  if (isDesktop) return <SubscriptionIframeWrapper page="plans" />;
  return <PlanComparison />;
});

Plans.displayName = 'Plans';
export default Plans;
