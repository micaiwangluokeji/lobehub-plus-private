import { Skeleton } from 'antd';
import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

const Loading = memo(() => {
  return (
    <Flexbox gap={24} style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
      <Skeleton active avatar paragraph={{ rows: 3 }} />
      <Skeleton active paragraph={{ rows: 2 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
    </Flexbox>
  );
});

export default Loading;
