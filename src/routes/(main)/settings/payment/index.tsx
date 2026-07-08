'use client';

import { CheckCircle, Clock, Loader2, QrCode, Smartphone, Wallet } from 'lucide-react';
import { Button, Card, Divider, Radio, Typography, message, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { topUpService } from '@/services/billing';

const { Title, Text } = Typography;

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
      } catch (error: any) {
        message.error(error?.message || '查询订单失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePay = async () => {
    if (!orderId) return;

    try {
      setRedirecting(true);
      const result = await topUpService.createPayment({ orderId, method: paymentMethod });
      setPaymentResult(result);

      if (paymentMethod === 'wechat') {
        if (result.codeUrl) {
          setQrCodeUrl(result.codeUrl);
        }
      } else if (paymentMethod === 'alipay' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (error: any) {
      message.error(error?.message || '创建支付失败');
    } finally {
      setRedirecting(false);
    }
  };

  useEffect(() => {
    if (!order || order.status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const orderData = await topUpService.queryOrder(orderId!);
        if (orderData?.status === 'paid') {
          setOrder(orderData);
          message.success('支付成功！');
          clearInterval(interval);
          setTimeout(() => {
            window.location.href = `/settings/payment/success?orderId=${orderId}`;
          }, 1500);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, order]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Text type="danger">订单不存在</Text>
      </div>
    );
  }

  if (order.status === 'paid') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={64} color="#52c41a" style={{ marginBottom: 16 }} />
            <Title level={3}>支付成功</Title>
            <Text type="secondary">您的订单已完成支付</Text>
            <Divider />
            <div style={{ marginTop: 16 }}>
              <Text>订单号：{order.id}</Text>
            </div>
            <div>
              <Text>金额：¥{order.amount}</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <Card>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">订单号</Text>
            <div>
              <Text strong>{order.id}</Text>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text type="secondary">金额</Text>
            <div>
              <Text strong style={{ fontSize: 32, color: '#faad14' }}>
                ¥{order.amount}
              </Text>
            </div>
          </div>

          <Divider />

          <div style={{ marginBottom: 24, textAlign: 'left' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              选择支付方式
            </Text>
            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <Radio.Button value="wechat" style={{ width: '100%' }}>
                <Smartphone size={20} style={{ marginRight: 8 }} />
                微信支付
              </Radio.Button>
              <Radio.Button value="alipay" style={{ width: '100%' }}>
                <Wallet size={20} style={{ marginRight: 8 }} />
                支付宝
              </Radio.Button>
            </Radio.Group>
          </div>

          {paymentMethod === 'wechat' && qrCodeUrl && (
            <div style={{ marginBottom: 24 }}>
              <Card style={{ display: 'inline-block' }}>
                <div style={{ width: 200, height: 200, backgroundColor: '#fff', padding: 8 }}>
                  <img
                    alt="支付二维码"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </Card>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  使用微信扫描二维码支付
                </Text>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={14} style={{ marginRight: 4 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                30分钟内完成支付
              </Text>
            </div>
          </div>

          <Button
            block
            loading={redirecting}
            onClick={handlePay}
            size="large"
            type="primary"
            disabled={paymentMethod === 'wechat' && !!qrCodeUrl}
          >
            {redirecting ? <Loader2 size={16} /> : null}
            {paymentMethod === 'wechat' && qrCodeUrl ? '扫码支付中...' : '立即支付'}
          </Button>

          {paymentMethod === 'alipay' && (
            <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
              点击后将跳转到支付宝页面
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}
