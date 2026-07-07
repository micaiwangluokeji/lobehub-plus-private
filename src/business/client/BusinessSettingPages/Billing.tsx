'use client';

import { isDesktop } from '@lobechat/const';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { SubscriptionIframeWrapper } from './SubscriptionIframeWrapper';

const BillingCenter = dynamic(() => import('@/features/Billing/BillingCenter'), { ssr: false });

const Billing = memo(() => {
  if (isDesktop) return <SubscriptionIframeWrapper page="billing" />;
  return <BillingCenter />;
});

Billing.displayName = 'Billing';
export default Billing;
