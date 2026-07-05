import { useTranslation } from 'react-i18next';

import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';

import ChatAppearance from '../chat-appearance/features/ChatAppearance';
import Appearance from '../common/features/Appearance';
import Common from '../common/features/Common/Common';
import NavVisibility from '../common/features/Common/NavVisibility';
import Desktop from './features/Desktop';

const Page = () => {
  const { t } = useTranslation('setting');
  return (
    <>
      <SettingHeader title={t('tab.appearance')} />
      <Common />
      <NavVisibility />
      <Appearance />
      <Desktop />
      <ChatAppearance />
    </>
  );
};

export default Page;
