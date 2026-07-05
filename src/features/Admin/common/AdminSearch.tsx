'use client';

import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { memo, useCallback, useState } from 'react';

interface AdminSearchProps {
  onSearch: (value: string) => void;
  placeholder?: string;
}

const AdminSearch = memo<AdminSearchProps>(({ onSearch, placeholder = '搜索...' }) => {
  const [value, setValue] = useState('');

  const handleSearch = useCallback(
    (val: string) => {
      onSearch(val);
    },
    [onSearch],
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  return (
    <Input
      allowClear
      onChange={handleChange}
      onPressEnter={() => handleSearch(value)}
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      size="middle"
      style={{ width: 300 }}
      value={value}
    />
  );
});

AdminSearch.displayName = 'AdminSearch';

export default AdminSearch;
