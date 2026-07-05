'use client';

import { isDesktop } from '@lobechat/const';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { SubscriptionIframeWrapper } from './SubscriptionIframeWrapper';

const UsageDashboard = dynamic(() => import('@/features/Billing/UsageDashboard'), { ssr: false });

const Usage = memo(() => {
  if (isDesktop) return <SubscriptionIframeWrapper page="usage" />;
  return <UsageDashboard />;
});

Usage.displayName = 'Usage';
export default Usage;
