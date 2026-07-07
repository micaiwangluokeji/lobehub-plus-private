'use client';

import { Card, Typography } from 'antd';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

const { Title, Paragraph } = Typography;

const AgreementPage = memo(() => {
  const { t } = useTranslation('admin');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'terms';

  useEffect(() => {
    if (!['terms', 'privacy'].includes(type)) {
      navigate(`/agreement?type=terms`, { replace: true });
    }
  }, [type, navigate]);

  const content = type === 'privacy' ? (
    <>
      <Title level={4}>{t('agreement.privacyTitle')}</Title>
      <Paragraph>{t('agreement.privacyIntro')}</Paragraph>
      <Title level={5}>{t('agreement.dataCollection')}</Title>
      <Paragraph>{t('agreement.dataCollectionDesc')}</Paragraph>
      <Title level={5}>{t('agreement.dataUsage')}</Title>
      <Paragraph>{t('agreement.dataUsageDesc')}</Paragraph>
      <Title level={5}>{t('agreement.dataProtection')}</Title>
      <Paragraph>{t('agreement.dataProtectionDesc')}</Paragraph>
      <Title level={5}>{t('agreement.userRights')}</Title>
      <Paragraph>{t('agreement.userRightsDesc')}</Paragraph>
      <Title level={5}>{t('agreement.contact')}</Title>
      <Paragraph>{t('agreement.contactDesc')}</Paragraph>
    </>
  ) : (
    <>
      <Title level={4}>{t('agreement.termsTitle')}</Title>
      <Paragraph>{t('agreement.termsIntro')}</Paragraph>
      <Title level={5}>{t('agreement.dataCollection')}</Title>
      <Paragraph>{t('agreement.dataCollectionDesc')}</Paragraph>
      <Title level={5}>{t('agreement.dataUsage')}</Title>
      <Paragraph>{t('agreement.dataUsageDesc')}</Paragraph>
      <Title level={5}>{t('agreement.dataProtection')}</Title>
      <Paragraph>{t('agreement.dataProtectionDesc')}</Paragraph>
      <Title level={5}>{t('agreement.userRights')}</Title>
      <Paragraph>{t('agreement.userRightsDesc')}</Paragraph>
      <Title level={5}>{t('agreement.contact')}</Title>
      <Paragraph>{t('agreement.contactDesc')}</Paragraph>
    </>
  );

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          {type === 'privacy' ? t('agreement.privacyTitle') : t('agreement.termsTitle')}
        </Title>
        <Paragraph type="secondary">
          {t('agreement.lastUpdated')}: 2025-01-01
        </Paragraph>
        {content}
      </Card>
    </div>
  );
});

AgreementPage.displayName = 'AgreementPage';
export default AgreementPage;
