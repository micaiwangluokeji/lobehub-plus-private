'use client';

import type { TablePaginationConfig, TableProps } from 'antd';
import { Table } from 'antd';
import type { AnyObject } from 'antd/es/_util/type';
import type { SorterResult } from 'antd/es/table/interface';
import { memo, useCallback } from 'react';

export interface AdminTableProps<T extends AnyObject> extends Omit<TableProps<T>, 'onChange'> {
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

const AdminTable = <T extends Record<string, any>>({
  columns,
  dataSource,
  loading,
  page,
  pageSize,
  total = 0,
  onPageChange,
  rowKey = 'id',
  ...rest
}: AdminTableProps<T>) => {
  const handleChange: TableProps<T>['onChange'] = useCallback(
    (pagination: TablePaginationConfig, _filters: any, _sorter: SorterResult<T> | SorterResult<T>[]) => {
      onPageChange?.(pagination.current || 1, pagination.pageSize || 20);
    },
    [onPageChange],
  );

  return (
    <Table<T>
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      onChange={handleChange}
      pagination={{
        current: page,
        pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`,
        total,
      }}
      rowKey={rowKey}
      size="middle"
      style={{ background: 'transparent' }}
      {...rest}
    />
  );
};

export default memo(AdminTable) as typeof AdminTable;
