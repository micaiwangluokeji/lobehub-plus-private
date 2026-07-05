'use client';

import { Button, Popconfirm, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { RbacRole } from '@/services/admin/roles';
import { adminRoleService } from '@/services/admin/roles';

import RoleForm from './RoleForm';
import RolePermissionPanel from './RolePermissionPanel';

const RoleList = memo(() => {
  const { t } = useTranslation('admin');

  const [data, setData] = useState<RbacRole[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
  const [permPanelOpen, setPermPanelOpen] = useState(false);
  const [permRoleId, setPermRoleId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const res = await adminRoleService.list({ keyword: kw, page: p, pageSize: ps });
        // API returns { data: { roles: [...], total: N }, ... }
        const body = res as unknown as { data: { total: number; roles: RbacRole[] } };
        setData(body.data.roles);
        setTotal(body.data.total);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    fetchData(page, pageSize, keyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    (val: string) => {
      setKeyword(val);
      setPage(1);
      fetchData(1, pageSize, val);
    },
    [fetchData, pageSize],
  );

  const handlePageChange = useCallback(
    (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
      fetchData(p, ps, keyword);
    },
    [fetchData, keyword],
  );

  const handleCreate = useCallback(() => {
    setEditingRole(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((role: RbacRole) => {
    setEditingRole(role);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminRoleService.remove(id);
        message.success(t('actions.delete') + ' ' + t('actions.confirm'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  const handleFormSuccess = useCallback(() => {
    setFormOpen(false);
    setEditingRole(null);
    fetchData(page, pageSize, keyword);
  }, [fetchData, page, pageSize, keyword]);

  const handleConfigPermissions = useCallback((roleId: string) => {
    setPermRoleId(roleId);
    setPermPanelOpen(true);
  }, []);

  const handlePermPanelSuccess = useCallback(() => {
    setPermPanelOpen(false);
    setPermRoleId(null);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Button onClick={handleCreate} type="primary">
            {t('roles.create')}
          </Button>
        }
        title={t('roles.title')}
      />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('actions.search')} />
      </div>
      <AdminTable<RbacRole>
        columns={[
          {
            dataIndex: 'name',
            key: 'name',
            title: t('roles.columns.name'),
          },
          {
            dataIndex: 'displayName',
            key: 'displayName',
            render: (val: string | null) => val || '-',
            title: t('roles.columns.displayName'),
          },
          {
            dataIndex: 'description',
            ellipsis: true,
            key: 'description',
            render: (val: string | null) => val || '-',
            title: t('roles.columns.description'),
          },
          {
            dataIndex: 'isSystem',
            key: 'isSystem',
            render: (val: boolean) => (
              <StatusTag
                status="system"
                text={val ? t('roles.type.system') : t('roles.type.custom')}
              />
            ),
            title: t('roles.columns.type'),
          },
          {
            dataIndex: 'isActive',
            key: 'isActive',
            render: (val: boolean) => (
              <StatusTag
                status={val ? 'enabled' : 'disabled'}
                text={val ? t('roles.status.active') : t('roles.status.inactive')}
              />
            ),
            title: t('roles.columns.status'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: RbacRole) => (
              <Space>
                <Button onClick={() => handleEdit(record)} size="small" type="link">
                  {t('actions.edit')}
                </Button>
                <Button onClick={() => handleConfigPermissions(record.id)} size="small" type="link">
                  {t('roles.permissionConfig')}
                </Button>
                {!record.isSystem && (
                  <Popconfirm
                    description={t('roles.confirmDelete')}
                    onConfirm={() => handleDelete(record.id)}
                    title={t('roles.delete')}
                  >
                    <Button danger size="small" type="link">
                      {t('actions.delete')}
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
            title: t('roles.columns.actions'),
            width: 280,
          },
        ]}
        dataSource={data}
        loading={loading}
        onPageChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      {formOpen && (
        <RoleForm
          onClose={() => {
            setFormOpen(false);
            setEditingRole(null);
          }}
          onSuccess={handleFormSuccess}
          open={formOpen}
          role={editingRole}
        />
      )}
      {permPanelOpen && permRoleId && (
        <RolePermissionPanel
          onClose={() => {
            setPermPanelOpen(false);
            setPermRoleId(null);
          }}
          onSuccess={handlePermPanelSuccess}
          open={permPanelOpen}
          roleId={permRoleId}
        />
      )}
    </div>
  );
});

RoleList.displayName = 'RoleList';

export default RoleList;
