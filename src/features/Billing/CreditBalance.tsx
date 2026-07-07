'use client';

import { Button, Card, List, Skeleton, Statistic, Typography, message } from 'antd';
import useSWR from 'swr';

import { creditService } from '@/services/billing';

const { Title } = Typography;

export default function CreditBalance() {
  const { data: balance, isLoading } = useSWR('billing:creditBalance', creditService.getMyBalance);
  const { data: history } = useSWR('billing:creditHistory', () => creditService.listMyHistory());

  if (isLoading) return <Skeleton active />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <Statistic
          prefix="💰"
          title="当前积分余额"
          value={balance ?? 0}
          suffix={
            <Button type="primary">充值积分 →</Button>
          }
        />
      </Card>

      <Title level={5}>交易记录</Title>
      <List
        dataSource={history ?? []}
        renderItem={(item: any) => (
          <List.Item extra={<Typography.Text type={item.amount > 0 ? 'success' : 'danger'}>{item.amount > 0 ? '+' : ''}{item.amount}</Typography.Text>}>
            <List.Item.Meta
              description={item.description || `${item.type} · ${new Date(item.createdAt).toLocaleDateString()}`}
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无交易记录，去充值吧 →' }}
      />
    </div>
  );
}
