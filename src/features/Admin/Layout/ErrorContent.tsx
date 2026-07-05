'use client';

import { Flexbox } from '@lobehub/ui';
import { Result } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

const ErrorContent = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  return (
    <Flexbox align="center" justify="center" style={{ height: '100vh' }}>
      <Result
        extra={
          <button onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            {t('backToHome')}
          </button>
        }
        status="403"
        subTitle={t('accessDenied')}
        title="403"
      />
    </Flexbox>
  );
};

export { ErrorContent };
