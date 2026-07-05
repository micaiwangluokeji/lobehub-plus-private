'use client';

import { Flexbox } from '@lobehub/ui';
import { Spin } from 'antd';

const LoadingScreen = () => (
  <Flexbox align="center" justify="center" style={{ height: '100vh' }}>
    <Spin size="large" />
  </Flexbox>
);

export { LoadingScreen };
