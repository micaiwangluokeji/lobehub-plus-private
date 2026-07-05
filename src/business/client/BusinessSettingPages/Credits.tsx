'use client';

import { isDesktop } from '@lobechat/const';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { SubscriptionIframeWrapper } from './SubscriptionIframeWrapper';

const CreditBalance = dynamic(() => import('@/features/Billing/CreditBalance'), { ssr: false });

const Credits = memo(() => {
  if (isDesktop) return <SubscriptionIframeWrapper page="credits" />;
  return <CreditBalance />;
});

Credits.displayName = 'Credits';
export default Credits;
