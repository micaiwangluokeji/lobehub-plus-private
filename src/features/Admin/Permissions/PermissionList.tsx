'use client';

import { Button, message, Select } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';
import { lambdaClient } from '@/libs/trpc/client';

import type { RbacPermission } from '@/services/admin/permissions';
import { adminPermissionService } from '@/services/admin/permissions';

/** Generate a readable Chinese description from a permission code. */
const describePermission = (perm: RbacPermission): string => {
  if (perm.description) return perm.description;

  const parts = perm.code.split(':');
  // e.g. "agent:read:all" → "所有代理的读取"
  // e.g. "agent:read" → "代理读取"
  const scopePart = parts[parts.length - 1];
  const actionPart = parts.length >= 2 ? parts[parts.length - 2] : '';
  const prefix = parts.slice(0, Math.max(1, parts.length - (parts.length >= 2 ? 2 : 1))).join(':');

  const actionMap: Record<string, string> = {
    create: '创建',
    delete: '删除',
    read: '读取',
    update: '更新',
    admin: '管理',
    export: '导出',
    import: '导入',
    approve: '审批',
    publish: '发布',
    transfer: '转让',
    view: '查看',
    manage: '管理',
    execute: '执行',
  };

  const scopeMap: Record<string, string> = {
    all: '全部',
    own: '自己的',
  };

  const action = actionMap[actionPart] || actionPart;
  const scope = scopeMap[scopePart] || scopePart;
  const resource = prefix;

  return `${scope}${resource}${action}权限`;
};

const PermissionList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<RbacPermission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string, cat?: string) => {
      setLoading(true);
      try {
        const res = await adminPermissionService.list({ category: cat, keyword: kw, page: p, pageSize: ps });
        // API returns { data: { permissions: [...], total: N }, ... }
        const body = res as unknown as { data: { total: number; permissions: RbacPermission[] } };
        setData(body.data.permissions);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    fetchData(page, pageSize, keyword, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val, category);
    },
    [category, fetchData, pageSize],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword, category);
    },
    [category, fetchData, keyword],
  );

  const handleCategoryChange = useCallback(
    (val: string | undefined) => {
      setCategory(val);
      setPage(1);
      fetchData(1, pageSize, keyword, val);
    },
    [fetchData, keyword, pageSize],
  );

  // Extract unique categories from data for filter
  const categories = [...new Set(data.map((p) => p.category).filter(Boolean))].sort();

  const [syncing, setSyncing] = useState(false);
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await lambdaClient.rbacSync.syncPermissions.mutate();
      message.success(`同步完成：${result.results.join(' | ')}`);
      fetchData(1, pageSize, keyword, category);
    } catch {
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Button loading={syncing} onClick={handleSync} type="primary">
            🔄 同步权限
          </Button>
        }
        title={t('permissions.title')}
      />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('actions.search')} />
        <Select
          allowClear
          onChange={handleCategoryChange}
          placeholder={t('permissions.filterCategory')}
          style={{ width: 200 }}
        >
          {categories.map((cat) => (
            <Select.Option key={cat} value={cat}>
              {cat}
            </Select.Option>
          ))}
        </Select>
      </div>
      <AdminTable<RbacPermission>
        columns={[
          {
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <code>{text}</code>,
            title: t('permissions.columns.code'),
          },
          {
            dataIndex: 'name',
            key: 'name',
            title: t('permissions.columns.name'),
          },
          {
            dataIndex: 'description',
            ellipsis: true,
            key: 'description',
            render: (_: unknown, record: RbacPermission) => describePermission(record),
            title: t('permissions.columns.description'),
          },
          {
            dataIndex: 'category',
            key: 'category',
            render: (text: string) => <StatusTag status="system" text={text} />,
            title: t('permissions.columns.category'),
          },
          {
            dataIndex: 'isActive',
            key: 'isActive',
            render: (val: boolean) => (
              <StatusTag
                status={val ? 'enabled' : 'disabled'}
                text={val ? '启用' : '禁用'}
              />
            ),
            title: t('permissions.columns.status'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('permissions.columns.createdAt'),
          },
        ]}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
});

PermissionList.displayName = 'PermissionList';

export default PermissionList;
