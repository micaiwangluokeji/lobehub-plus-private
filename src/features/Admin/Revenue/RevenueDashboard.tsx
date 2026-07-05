import { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, DatePicker, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { adminRevenueService } from '@/services/admin/revenue';
import type { RevenueDashboardStats, SubscriptionAnalytics, CreditAnalytics } from '@/services/admin/revenue';

const { RangePicker } = DatePicker;

const RevenueDashboard = () => {
  const [stats, setStats] = useState<RevenueDashboardStats | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [creditAnalytics, setCreditAnalytics] = useState<CreditAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (params?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      const [statsData, subscriptionData, creditData] = await Promise.all([
        adminRevenueService.getDashboardStats(params),
        adminRevenueService.getSubscriptionAnalytics(),
        adminRevenueService.getCreditAnalytics(),
      ]);
      setStats(statsData);
      setSubscriptionAnalytics(subscriptionData);
      setCreditAnalytics(creditData);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      fetchData({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      fetchData();
    }
  };

  const subscriptionColumns: ColumnsType<any> = [
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '数量', dataIndex: 'count', key: 'count' },
  ];

  const billingCycleColumns: ColumnsType<any> = [
    { title: '计费周期', dataIndex: 'billingCycle', key: 'billingCycle' },
    { title: '数量', dataIndex: 'count', key: 'count' },
  ];

  const creditTypeColumns: ColumnsType<any> = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount' },
    { title: '次数', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>收入仪表盘</h2>
        <RangePicker onChange={handleDateChange} />
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃订阅数"
              value={stats?.activeSubscriptionsCount || 0}
              prefix={<ArrowUpOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总销售积分"
              value={stats?.totalCreditsSold || 0}
              suffix="积分"
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总消费成本"
              value={stats?.totalSpendCost || 0}
              prefix="¥"
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总消耗 Token"
              value={stats?.totalTokensUsed || 0}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 订阅分析 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="订阅状态分布" loading={loading}>
            <Table
              columns={subscriptionColumns}
              dataSource={subscriptionAnalytics?.byStatus || []}
              rowKey="status"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="计费周期分布" loading={loading}>
            <Table
              columns={billingCycleColumns}
              dataSource={subscriptionAnalytics?.byBillingCycle || []}
              rowKey="billingCycle"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 积分分析 */}
      <Card title="积分交易分析" loading={loading}>
        <Table
          columns={creditTypeColumns}
          dataSource={creditAnalytics?.byType || []}
          rowKey="type"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default RevenueDashboard;
