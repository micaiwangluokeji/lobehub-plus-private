import { useTranslation } from 'react-i18next';

import Review from '@/features/Review';
import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';

const Page = () => {
  const { t } = useTranslation('setting');
  return (
    <>
      <SettingHeader title={t('review.title')} />
      <Review />
    </>
  );
};

export default Page;
