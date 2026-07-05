'use client';

import { CreditCard, Gift, History, Sparkles, TrendingUp } from 'lucide-react';
import { Button, Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import useSWR from 'swr';

import { creditService, planService, subscriptionService } from '@/services/billing';

const { Title } = Typography;

export default function BillingCenter() {
  const { data: balance, isLoading: balanceLoading } = useSWR('billing:creditBalance', creditService.getMyBalance);
  const { data: plans, isLoading: plansLoading } = useSWR('billing:publicPlans', planService.listPublicPlans);
  const { data: subscription } = useSWR('billing:activeSubscription', subscriptionService.getActiveSubscription);

  const loading = balanceLoading || plansLoading;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Title level={3}>计费中心</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              loading={loading}
              prefix="💰"
              title="积分余额"
              value={balance ?? 0}
              suffix={
                <Button href="/settings/billing/credits" size="small" type="link">
                  充值 →
                </Button>
              }
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              loading={loading}
              prefix="📦"
              title="当前套餐"
              value={subscription ? 'Pro' : 'Free'}
              suffix={
                !subscription ? (
                  <Button href="/settings/billing/plans" size="small" type="primary">
                    升级 Pro →
                  </Button>
                ) : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {[
          { icon: <Sparkles />, title: '套餐对比', desc: '查看全部套餐', path: '/settings/billing/plans' },
          { icon: <CreditCard />, title: '积分充值', desc: '购买更多积分', path: '/settings/billing/credits' },
          { icon: <TrendingUp />, title: '用量统计', desc: 'Token 消耗趋势', path: '/settings/billing/usage' },
          { icon: <Gift />, title: '邀请好友', desc: '邀请得积分', path: '/settings/billing/referral' },
          { icon: <History />, title: '订单记录', desc: '历史订单', path: '/settings/billing/history' },
        ].map((item) => (
          <Col key={item.path} span={8}>
            <Card hoverable onClick={() => window.location.href = item.path}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <Title level={5}>{item.title}</Title>
                <Typography.Text type="secondary">{item.desc}</Typography.Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
