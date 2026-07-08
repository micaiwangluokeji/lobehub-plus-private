'use client';

import { CheckCircle } from 'lucide-react';
import { Button, Card, Divider, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { topUpService } from '@/services/billing';

const { Title, Text } = Typography;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      message.error('订单ID不能为空');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await topUpService.queryOrder(orderId);
        setOrder(orderData);

        if (orderData?.status === 'paid') {
          message.success('支付成功！');
        }
      } catch (error) {
        message.error('查询订单失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleBack = () => {
    navigate('/settings/billing');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography.Text>加载中...</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={64} color="#52c41a" style={{ marginBottom: 16 }} />
          <Title level={3}>支付成功</Title>
          <Text type="secondary">您的订单已完成支付</Text>

          {order && (
            <>
              <Divider />
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">订单号</Text>
                </div>
                <Text strong>{order.id}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">金额</Text>
                </div>
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                  ¥{order.amount}
                </Text>
              </div>
              {order.credits > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">获得积分</Text>
                  </div>
                  <Text strong style={{ fontSize: 20 }}>
                    +{order.credits}
                  </Text>
                </div>
              )}
            </>
          )}

          <Button block onClick={handleBack} size="large" type="primary">
            返回计费中心
          </Button>
        </div>
      </Card>
    </div>
  );
}
