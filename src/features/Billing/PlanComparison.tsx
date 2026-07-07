'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Col, Row, Skeleton, Tag, Typography } from 'antd';
import useSWR from 'swr';

import { planService, topUpService } from '@/services/billing';

const { Title, Text } = Typography;

export default function PlanComparison() {
  const { data: plans, isLoading } = useSWR('billing:publicPlans', planService.listPublicPlans);

  if (isLoading) return <Skeleton active />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Title level={3}>选择适合你的套餐</Title>
      <Row gutter={[16, 16]}>
        {(plans ?? []).map((plan: any) => (
          <Col key={plan.id} span={8}>
            <Card
              hoverable
              title={plan.name}
              extra={<Tag color="blue">¥{plan.price}/{plan.billingCycle === 'yearly' ? '年' : '月'}</Tag>}
            >
              <div style={{ minHeight: 200 }}>
                {(plan.features ?? []).map((f: string, i: number) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <CheckCircle size={14} style={{ marginRight: 4 }} />
                    <Text>{f}</Text>
                  </div>
                ))}
                <div style={{ marginBottom: 4 }}>
                  <Text strong>每月 {plan.monthlyCredits || 0} 积分</Text>
                </div>
              </div>
              <Button
                block
                onClick={async () => {
                  try {
                    await topUpService.createOrder({
                      planId: plan.id,
                      amount: plan.price,
                      credits: plan.monthlyCredits || 0,
                    });
                    window.location.href = '/settings/billing?order=created';
                  } catch { /* noop */ }
                }}
                type="primary"
              >
                订阅 →
              </Button>
            </Card>
          </Col>
        ))}
        {(!plans || plans.length === 0) && (
          <Col span={24}>
            <Card>
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                暂无可用套餐，请联系管理员配置
              </Text>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
