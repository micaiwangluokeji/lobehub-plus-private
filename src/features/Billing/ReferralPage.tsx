'use client';

import { Copy } from 'lucide-react';
import { Button, Card, Input, List, Statistic, Typography, message } from 'antd';
import useSWR from 'swr';

import { referralService } from '@/services/billing';

const { Title, Text } = Typography;

export default function ReferralPage() {
  const { data: stats, mutate } = useSWR('billing:referralStats', referralService.getReferralStats);
  const { data: referrals } = useSWR('billing:myReferrals', referralService.getMyReferrals);

  const handleGenerate = async () => {
    try {
      const invite = await referralService.generateInviteCode();
      message.success(`邀请码: ${invite.code}`);
      mutate();
    } catch {
      message.error('生成失败');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Title level={3}>邀请好友，双方各得积分</Title>

      <Card style={{ marginBottom: 24 }}>
        <Button block icon={<Copy />} onClick={handleGenerate} type="primary">
          生成邀请码
        </Button>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Statistic title="已邀请" value={stats?.totalInvited ?? 0} />
        <Statistic prefix="💰" title="获得积分" value={stats?.totalCreditsEarned ?? 0} />
      </Card>

      <Title level={5}>推荐记录</Title>
      <List
        dataSource={referrals ?? []}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              description={`加入于 ${new Date(item.createdAt).toLocaleDateString()} · 奖励 ${item.status === 'used' ? '已发放' : '待发放'}`}
            />
          </List.Item>
        )}
        locale={{ emptyText: '还没有邀请记录，快去邀请好友吧！' }}
      />
    </div>
  );
}
