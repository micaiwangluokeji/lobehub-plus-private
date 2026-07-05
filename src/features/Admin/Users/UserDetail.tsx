'use client';

import { Button, Card, Descriptions, Space, Spin, Tag, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { PageHeader, StatusTag } from '@/features/Admin/common';

import type { AdminUser, UserRole } from '@/services/admin/users';
import { adminUserService } from '@/services/admin/users';

const UserDetail = memo(() => {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userData, rolesData] = await Promise.all([
        adminUserService.getById(id),
        adminUserService.getRoles(id),
      ]);
      setUser(userData);
      setRoles(rolesData);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await adminUserService.remove(id);
      message.success(t('users.delete') + ' ' + t('actions.save'));
      navigate('/admin/users');
    } catch {}
  }, [id, navigate, t]);

  if (loading) {
    return (
      <div style={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: 24, textAlign: 'center' }}>用户不存在</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        actions={
          <Space>
            <Button onClick={() => navigate('/admin/users')}>{t('backToHome')}</Button>
            <Button
              danger
              onClick={handleDelete}
            >
              {t('users.delete')}
            </Button>
          </Space>
        }
        title={user.username || user.email || user.id}
      />
      <Card style={{ marginBottom: 24 }} title={t('users.basicInfo')}>
        <Descriptions column={2}>
          <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label={t('users.columns.username')}>{user.username || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('users.columns.email')}>{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('users.columns.fullName')}>{user.fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('users.columns.status')}>
            <StatusTag
              status={user.banned ? 'banned' : 'active'}
              text={user.banned ? t('users.banned') : t('users.active')}
            />
          </Descriptions.Item>
          <Descriptions.Item label={t('users.registrationDate')}>
            {new Date(user.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={t('users.columns.lastActive')}>
            {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title={t('users.assignedRoles')}>
        {roles.length === 0 ? (
          <span style={{ color: 'var(--ant-color-text-quaternary)' }}>暂无角色</span>
        ) : (
          roles.map((role) => (
            <Tag key={role.id} color={role.isSystem ? 'blue' : 'default'}>
              {role.name}
              {role.displayName ? ` (${role.displayName})` : ''}
            </Tag>
          ))
        )}
      </Card>
    </div>
  );
});

UserDetail.displayName = 'UserDetail';

export default UserDetail;
