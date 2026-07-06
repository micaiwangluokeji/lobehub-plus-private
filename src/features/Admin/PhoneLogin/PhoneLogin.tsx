'use client';

import { Button, Input, message } from 'antd';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PhoneLoginProps {
  loading?: boolean;
  onSwitchToAccount?: () => void;
  onSwitchToWechat?: () => void;
}

const PhoneLogin = memo<PhoneLoginProps>(({ loading, onSwitchToAccount, onSwitchToWechat }) => {
  const { t } = useTranslation('admin');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSending, setCodeSending] = useState(false);

  const handleSendCode = async () => {
    if (!phone || phone.length < 11) {
      message.warning(t('phoneLogin.phoneNumberPlaceholder'));
      return;
    }
    setCodeSending(true);
    try {
      await fetch('/api/v1/auth/send-sms-code', {
        body: JSON.stringify({ phone }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      message.success(t('phoneLogin.codeSent'));
    } catch {
      message.error('发送失败');
    } finally {
      setCodeSending(false);
    }
  };

  const handleLogin = async () => {
    if (!code) {
      message.warning(t('phoneLogin.verificationCodePlaceholder'));
      return;
    }
    try {
      await fetch('/api/v1/auth/phone-login', {
        body: JSON.stringify({ code, phone }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      window.location.href = '/';
    } catch {
      message.error('登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
      <Input
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('phoneLogin.phoneNumberPlaceholder')}
        size="large"
        style={{ padding: '8px 12px' }}
        value={phone}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('phoneLogin.verificationCodePlaceholder')}
          size="large"
          style={{ flex: 1, padding: '8px 12px' }}
          value={code}
        />
        <Button loading={codeSending} onClick={handleSendCode} style={{ whiteSpace: 'nowrap' }}>
          {t('phoneLogin.getCode')}
        </Button>
      </div>
      <Button
        loading={loading}
        onClick={handleLogin}
        size="large"
        type="primary"
      >
        {t('phoneLogin.title')}
      </Button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        {onSwitchToAccount && (
          <Button size="small" type="link" onClick={onSwitchToAccount}>
            {t('phoneLogin.switchToAccount')}
          </Button>
        )}
        {onSwitchToWechat && (
          <Button size="small" type="link" onClick={onSwitchToWechat}>
            {t('phoneLogin.switchToWechat')}
          </Button>
        )}
      </div>
    </div>
  );
});

PhoneLogin.displayName = 'PhoneLogin';
export default PhoneLogin;
