'use client';

import { isDesktop } from '@lobechat/const';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { SubscriptionIframeWrapper } from './SubscriptionIframeWrapper';

const ReferralPage = dynamic(() => import('@/features/Billing/ReferralPage'), { ssr: false });

const Referral = memo(() => {
  if (isDesktop) return <SubscriptionIframeWrapper page="referral" />;
  return <ReferralPage />;
});

Referral.displayName = 'Referral';
export default Referral;
