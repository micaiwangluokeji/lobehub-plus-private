'use client';

import { Tag } from 'antd';
import { memo } from 'react';

type StatusType = 'active' | 'inactive' | 'banned' | 'system' | 'enabled' | 'disabled';

interface StatusTagProps {
  status: StatusType;
  text?: string;
}

const statusColorMap: Record<StatusType, string> = {
  active: 'green',
  banned: 'red',
  disabled: 'default',
  enabled: 'green',
  inactive: 'default',
  system: 'blue',
};

const StatusTag = memo<StatusTagProps>(({ status, text }) => (
  <Tag color={statusColorMap[status] || 'default'}>{text || status}</Tag>
));

StatusTag.displayName = 'StatusTag';

export default StatusTag;
