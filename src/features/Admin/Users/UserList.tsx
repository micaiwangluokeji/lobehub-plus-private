'use client';

import { Button, Popconfirm, Space, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AdminSearch, AdminTable, PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminUser } from '@/services/admin/users';
import { adminUserService } from '@/services/admin/users';

import UserForm from './UserForm';
import UserRolePanel from './UserRolePanel';

const UserList = memo(() => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();

  const [data, setData] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [rolePanelOpen, setRolePanelOpen] = useState(false);
  const [rolePanelUserId, setRolePanelUserId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (p: number, ps: number, kw: string) => {
      setLoading(true);
      try {
        const res = await adminUserService.list({ keyword: kw, page: p, pageSize: ps });
        // API returns { data: { total, users: [...] }, ... }
        const body = res as unknown as { data: { total: number; users: AdminUser[] } };
        setData(body.data.users);
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
    setEditingUser(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((user: AdminUser) => {
    setEditingUser(user);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adminUserService.remove(id);
        message.success(t('users.delete') + ' ' + t('actions.save'));
        fetchData(page, pageSize, keyword);
      } catch {}
    },
    [fetchData, page, pageSize, keyword, t],
  );

  const handleFormSuccess = useCallback(() => {
    setFormOpen(false);
    setEditingUser(null);
    fetchData(page, pageSize, keyword);
  }, [fetchData, page, pageSize, keyword]);

  const handleManageRoles = useCallback((userId: string) => {
    setRolePanelUserId(userId);
    setRolePanelOpen(true);
  }, []);

  const handleRolePanelSuccess = useCallback(() => {
    setRolePanelOpen(false);
    setRolePanelUserId(null);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Button onClick={handleCreate} type="primary">
            {t('users.create')}
          </Button>
        }
        subtitle=""
        title={t('users.title')}
      />
      <div style={{ marginBottom: 16 }}>
        <AdminSearch onSearch={handleSearch} placeholder={t('users.searchPlaceholder')} />
      </div>
      <AdminTable<AdminUser>
        columns={[
          {
            dataIndex: 'username',
            key: 'username',
            render: (text: string, record: AdminUser) => (
              <span
                onClick={() => navigate(`/admin/users/${record.id}`)}
                style={{ color: 'var(--ant-color-primary)', cursor: 'pointer' }}
              >
                {text || '-'}
              </span>
            ),
            title: t('users.columns.username'),
          },
          {
            dataIndex: 'email',
            key: 'email',
            title: t('users.columns.email'),
          },
          {
            dataIndex: 'fullName',
            key: 'fullName',
            title: t('users.columns.fullName'),
          },
          {
            dataIndex: 'banned',
            key: 'status',
            render: (banned: boolean) => (
              <StatusTag status={banned ? 'banned' : 'active'} text={banned ? t('users.banned') : t('users.active')} />
            ),
            title: t('users.columns.status'),
          },
          {
            dataIndex: 'lastActiveAt',
            key: 'lastActiveAt',
            render: (val: string | null) => (val ? new Date(val).toLocaleString() : '-'),
            title: t('users.columns.lastActive'),
          },
          {
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => new Date(val).toLocaleString(),
            title: t('users.columns.createdAt'),
          },
          {
            key: 'actions',
            render: (_: unknown, record: AdminUser) => (
              <Space>
                <Button onClick={() => handleEdit(record)} size="small" type="link">
                  {t('actions.edit')}
                </Button>
                <Button onClick={() => handleManageRoles(record.id)} size="small" type="link">
                  {t('users.manageRoles')}
                </Button>
                <Popconfirm
                  description={t('users.confirmDelete')}
                  onConfirm={() => handleDelete(record.id)}
                  title={t('users.delete')}
                >
                  <Button danger size="small" type="link">
                    {t('actions.delete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
            title: t('users.columns.actions'),
            width: 240,
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
        <UserForm
          onClose={() => {
            setFormOpen(false);
            setEditingUser(null);
          }}
          onSuccess={handleFormSuccess}
          open={formOpen}
          user={editingUser}
        />
      )}
      {rolePanelOpen && rolePanelUserId && (
        <UserRolePanel
          onClose={() => {
            setRolePanelOpen(false);
            setRolePanelUserId(null);
          }}
          onSuccess={handleRolePanelSuccess}
          open={rolePanelOpen}
          userId={rolePanelUserId}
        />
      )}
    </div>
  );
});

UserList.displayName = 'UserList';

export default UserList;
