'use client';

import { CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card, Modal, Space, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';

import { planService, topUpService } from '@/services/billing';

import type { ProFeature } from './index';

const { Title, Text } = Typography;

interface UpgradeModalProps {
  feature: ProFeature;
  open: boolean;
  onClose: () => void;
}

const FEATURE_DESCRIPTIONS: Record<ProFeature, string> = {
  create_agent: '升级 Pro 即可创建自定义 Agent',
  custom_model: '升级 Pro 即可添加自定义 AI 模型',
  custom_provider: '升级 Pro 即可配置自定义 AI 服务商',
  create_group: '升级 Pro 即可创建群组',
  fork_agent: '升级 Pro 即可 Fork Agent',
  publish_agent: '升级 Pro 即可发布 Agent 到 Discover 市场',
};

export default function UpgradeModal({ feature, open, onClose }: UpgradeModalProps) {
  const { data: plans, isLoading } = useSWR('billing:publicPlans', planService.listPublicPlans);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    try {
      const plan = plans?.find((p) => p.id === planId);
      if (!plan) return;

      const order = await topUpService.createOrder({
        planId,
        amount: plan.price,
        credits: plan.monthlyCredits || 0,
        description: `订阅 ${plan.name}`,
      });

      // Open payment page in new tab or redirect
      message.success('订单已创建，请完成支付');
      window.open(`/settings/billing?orderId=${order.id}`, '_blank');
      onClose();
    } catch {
      message.error('创建订单失败，请稍后重试');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={open}
      title="升级到 Pro"
      width={560}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={5}>{FEATURE_DESCRIPTIONS[feature]}</Title>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={32} />
          </div>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {plans?.map((plan) => (
              <Card
                hoverable
                key={plan.id}
                onClick={() => handleSubscribe(plan.id)}
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>{plan.name}</Text>
                    <Tag color="blue">¥{plan.price}/{plan.billingCycle === 'yearly' ? '年' : '月'}</Tag>
                  </Space>
                  {plan.features?.length > 0 && (
                    <Space direction="vertical" size={2}>
                      {plan.features.map((f, i) => (
                        <Text key={i} type="secondary">
                          <CheckCircle size={12} /> {f}
                        </Text>
                      ))}
                    </Space>
                  )}
                  <Button
                    block
                    loading={subscribing}
                    type="primary"
                  >
                    {subscribing ? '处理中...' : `订阅 ${plan.name}`}
                  </Button>
                </Space>
              </Card>
            ))}
            {(!plans || plans.length === 0) && (
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                暂无可用套餐，请联系管理员
              </Text>
            )}
          </Space>
        )}

        <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
          🔒 订阅后自动解锁 Pro 全部功能
        </Text>
      </Space>
    </Modal>
  );
}
