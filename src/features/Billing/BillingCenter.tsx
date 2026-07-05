'use client';

import { Gift, History, Sparkles, TrendingUp } from 'lucide-react';
import { Button, Card, Col, Drawer, List, Modal, Row, Skeleton, Statistic, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';

import { creditService, planService, referralService, topUpService } from '@/services/billing';

const { Title, Text } = Typography;

export default function BillingCenter() {
  const { data: balance, isLoading } = useSWR('billing:creditBalance', creditService.getMyBalance);
  const { data: plans } = useSWR('billing:publicPlans', planService.listPublicPlans);
  const { data: history } = useSWR('billing:creditHistory', () => creditService.listMyHistory(1, 50));
  const { data: referrals } = useSWR('billing:myReferrals', referralService.getMyReferrals);
  const { data: referralStats } = useSWR('billing:referralStats', referralService.getReferralStats);

  // Modal states
  const [plansOpen, setPlansOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(true);
    try {
      const plan = plans?.find((p: any) => p.id === planId);
      const order = await topUpService.createOrder({
        planId, amount: plan?.price || 0, credits: plan?.monthlyCredits || 0,
      });
      message.success('订单已创建');
      setPlansOpen(false);
    } catch { message.error('失败'); }
    finally { setSubscribing(false); }
  };

  const handleGenerateInvite = async () => {
    try {
      await referralService.generateInviteCode();
      message.success('邀请码已生成！');
    } catch { message.error('生成失败'); }
  };

  const menuItems = [
    { icon: <Sparkles />, title: '套餐对比', desc: '查看全部套餐', action: () => setPlansOpen(true) },
    { icon: <TrendingUp />, title: '用量统计', desc: 'Token 消耗趋势', action: () => setUsageOpen(true) },
    { icon: <Gift />, title: '邀请好友', desc: '邀请得积分', action: () => setReferralOpen(true) },
    { icon: <History />, title: '订单记录', desc: '历史订单', action: () => setHistoryOpen(true) },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Title level={3}>计费中心</Title>

      {/* Balance Card */}
      <Card style={{ marginBottom: 16, textAlign: 'center' }}>
        <Statistic
          loading={isLoading}
          prefix="💰"
          title="当前积分余额"
          value={balance ?? 0}
          suffix={
            <Button onClick={() => setCreditsOpen(true)} size="small" type="primary">
              积分详情 →
            </Button>
          }
        />
      </Card>

      {/* Menu */}
      <Row gutter={[12, 12]}>
        {menuItems.map((item) => (
          <Col key={item.title} span={12}>
            <Card hoverable onClick={item.action} size="small">
              <div style={{ textAlign: 'center', padding: 8 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Modals ── */}

      {/* Plans Modal */}
      <Modal footer={null} onCancel={() => setPlansOpen(false)} open={plansOpen} title="选择套餐" width={520}>
        {(plans ?? []).map((plan: any) => (
          <Card hoverable key={plan.id} onClick={() => handleSubscribe(plan.id)} style={{ marginBottom: 8 }}>
            <Row align="middle" justify="space-between">
              <Col><Text strong>{plan.name}</Text></Col>
              <Col><Tag color="blue">¥{plan.price}/{plan.billingCycle === 'yearly' ? '年' : '月'}</Tag></Col>
            </Row>
            <Text type="secondary">{plan.monthlyCredits || 0} 积分/月</Text>
            <Button block loading={subscribing} type="primary" style={{ marginTop: 8 }}>订阅 →</Button>
          </Card>
        ))}
      </Modal>

      {/* Credits Modal */}
      <Modal footer={null} onCancel={() => setCreditsOpen(false)} open={creditsOpen} title="积分详情" width={520}>
        <Statistic title="当前余额" value={balance ?? 0} style={{ marginBottom: 16 }} />
        <Title level={5}>交易记录</Title>
        <List
          dataSource={history ?? []}
          renderItem={(item: any) => (
            <List.Item extra={
              <Text type={item.amount > 0 ? 'success' : 'danger'}>
                {item.amount > 0 ? '+' : ''}{item.amount}
              </Text>
            }>
              <List.Item.Meta
                description={item.description || `${item.type} · ${new Date(item.createdAt).toLocaleDateString()}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无交易记录' }}
          style={{ maxHeight: 300, overflow: 'auto' }}
        />
      </Modal>

      {/* Referral Modal */}
      <Modal footer={null} onCancel={() => setReferralOpen(false)} open={referralOpen} title="邀请好友" width={520}>
        <Card style={{ marginBottom: 16 }}>
          <Button block onClick={handleGenerateInvite} type="primary">生成邀请码</Button>
        </Card>
        <Statistic title="已邀请" value={referralStats?.totalInvited ?? 0} prefix="👥" />
        <Statistic title="获得积分" value={referralStats?.totalCreditsEarned ?? 0} prefix="💰" />
        <List
          dataSource={referrals ?? []}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta description={`${new Date(item.createdAt).toLocaleDateString()}`} />
            </List.Item>
          )}
          locale={{ emptyText: '还没有邀请记录' }}
        />
      </Modal>

      {/* Usage Modal */}
      <Modal footer={null} onCancel={() => setUsageOpen(false)} open={usageOpen} title="用量统计" width={520}>
        <Card><Statistic title="本月 Token 消耗" value="—" /><Text type="secondary">详细统计开发中</Text></Card>
      </Modal>

      {/* History Modal */}
      <Modal footer={null} onCancel={() => setHistoryOpen(false)} open={historyOpen} title="订单记录" width={520}>
        <Card><Text type="secondary">暂无订单记录</Text></Card>
      </Modal>
    </div>
  );
}
