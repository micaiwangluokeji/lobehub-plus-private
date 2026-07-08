import { Flexbox } from '@lobehub/ui';
import { type FC } from 'react';
import { Outlet } from 'react-router';

const styles = {
  mainContainer: {
    flex: 1,
    height: '100%',
    overflow: 'auto',
  },
};

const Layout: FC = () => {
  return (
    <Flexbox className={styles.mainContainer} flex={1} height={'100%'}>
      <Outlet />
    </Flexbox>
  );
};

export default Layout;
