'use client';

import { Button, message, Tag } from 'antd';
import { Edit, Shield } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { PageHeader } from '@/features/Admin/common';
import type { PermissionInfo, RbacRole } from '@/services/admin/roles';
import { adminRoleService } from '@/services/admin/roles';
import { adminPermissionService } from '@/services/admin/permissions';
import RoleForm from './RoleForm';
import RolePermissionPanel from './RolePermissionPanel';

const RoleDetail = memo(() => {
  const { t } = useTranslation('admin');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<RbacRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);

  const fetchRole = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const roleData = await adminRoleService.getById(id);
      setRole(roleData);
      const permData = await adminRoleService.getPermissions(id);
      if (permData && typeof permData === 'object' && 'permissions' in permData) {
        setPermissions((permData as { permissions: PermissionInfo[] }).permissions);
      }
    } catch {
      message.error(t('roles.detail.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const cat = (perm as Record<string, unknown>).category as string || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    },
    {} as Record<string, PermissionInfo[]>,
  );

  if (loading && !role) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-quaternary)' }}>
        {t('roles.detail.loading')}
      </div>
    );
  }

  if (!role) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>{t('roles.detail.notFound')}</p>
        <Button onClick={() => navigate('/admin/roles')} type="primary">
          {t('nav.backToMain')}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        onBack={() => navigate('/admin/roles')}
        subtitle={role.description || t('roles.detail')}
        title={`${role.displayName || role.name}`}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<Edit size={16} />} onClick={() => setEditOpen(true)}>
            {t('actions.edit')}
          </Button>
          <Button icon={<Shield size={16} />} onClick={() => setPermOpen(true)} type="primary">
            {t('roles.permissionConfig')}
          </Button>
        </div>
      </PageHeader>

      {/* Basic Info */}
      <div
        style={{
          background: 'var(--ant-color-bg-container)',
          borderRadius: 12,
          border: '1px solid var(--ant-color-border-secondary)',
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{t('roles.detail.basicInfo')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: 14 }}>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.name')}</div>
          <div>{role.name}</div>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.displayName')}</div>
          <div>{role.displayName || '-'}</div>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.description')}</div>
          <div>{role.description || '-'}</div>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.type')}</div>
          <div>
            <Tag>{((role as Record<string, unknown>).isSystem as boolean) ? t('roles.type.system') : t('roles.type.custom')}</Tag>
          </div>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.status')}</div>
          <div>
            <Tag color={(role as Record<string, unknown>).isActive ? 'green' : 'red'}>
              {(role as Record<string, unknown>).isActive ? t('roles.active') : t('roles.inactive')}
            </Tag>
          </div>
          <div style={{ color: 'var(--ant-color-text-quaternary)' }}>{t('roles.columns.permissionCount')}</div>
          <div>
            <Tag>{permissions.length}</Tag>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div
        style={{
          background: 'var(--ant-color-bg-container)',
          borderRadius: 12,
          border: '1px solid var(--ant-color-border-secondary)',
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{t('roles.detail.permissions')}</div>
        {permissions.length === 0 ? (
          <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 14 }}>{t('roles.detail.noPermissions')}</div>
        ) : (
          Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ant-color-text-secondary)', marginBottom: 8 }}>
                {category}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {perms.map((perm) => (
                  <Tag key={perm.id}>
                    {(perm as Record<string, unknown>).code as string || (perm as Record<string, unknown>).name as string}
                  </Tag>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <RoleForm
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          fetchRole();
        }}
        open={editOpen}
        role={role}
      />

      <RolePermissionPanel
        onClose={() => setPermOpen(false)}
        onSuccess={() => {
          setPermOpen(false);
          fetchRole();
        }}
        open={permOpen}
        roleId={id!}
      />
    </div>
  );
});

RoleDetail.displayName = 'RoleDetail';

export default RoleDetail;
