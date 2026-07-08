'use client';

import { XCircle } from 'lucide-react';
import { Button, Card, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { topUpService } from '@/services/billing';

const { Title, Text } = Typography;

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderData = await topUpService.queryOrder(orderId);
        setOrder(orderData);
      } catch {
        // ignore
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleRetry = () => {
    if (orderId) {
      navigate(`/settings/payment?orderId=${orderId}`);
    } else {
      navigate('/settings/plans');
    }
  };

  const handleBack = () => {
    navigate('/settings/plans');
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <XCircle size={64} color="#ff4d4f" style={{ marginBottom: 16 }} />
          <Title level={3}>支付已取消</Title>
          <Text type="secondary">您可以重新选择套餐进行支付</Text>

          {order && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Text type="secondary">订单号：{order.id}</Text>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <Button block onClick={handleRetry} size="large">
              重试支付
            </Button>
            <Button block onClick={handleBack} size="large" type="primary">
              返回套餐
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
