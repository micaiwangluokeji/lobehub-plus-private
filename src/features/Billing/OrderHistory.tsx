'use client';

import { Button, Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';

import { useUserRoles } from '@/hooks/useUserRoles';

const { Title } = Typography;

export default function OrderHistory() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Title level={3}>订单记录</Title>
      <Card>
        <Typography.Text type="secondary">暂无订单记录</Typography.Text>
      </Card>
    </div>
  );
}
