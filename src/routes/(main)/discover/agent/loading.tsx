import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import GridLoadingCard from '@/routes/(main)/community/components/GridLoadingCard';

const Loading = memo(() => {
  return (
    <Flexbox gap={32} width={'100%'}>
      <GridLoadingCard count={9} rows={3} />
    </Flexbox>
  );
});

export default Loading;
