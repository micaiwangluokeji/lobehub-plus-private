'use client';

import { Card, Statistic, Typography } from 'antd';

const { Title } = Typography;

export default function UsageDashboard() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Title level={3}>用量统计</Title>
      <Card>
        <Statistic title="Token 消耗" value="—" suffix="本月" />
        <Typography.Text type="secondary">详细统计功能开发中</Typography.Text>
      </Card>
    </div>
  );
}
