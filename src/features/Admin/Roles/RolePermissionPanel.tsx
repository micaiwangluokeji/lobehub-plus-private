'use client';

import { Button, Checkbox, Modal, Space, Spin, message } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { lambdaClient } from '@/libs/trpc/client';
import type { PermissionInfo } from '@/services/admin/roles';
import { adminRoleService } from '@/services/admin/roles';
import { adminPermissionService } from '@/services/admin/permissions';

interface RolePermissionPanelProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  roleId: string;
}

const RolePermissionPanel = memo<RolePermissionPanelProps>(({ open, onClose, onSuccess, roleId }) => {
  const { t } = useTranslation('admin');
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([]);
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await lambdaClient.rbacSync.syncPermissions.mutate();
      message.success('权限已同步，请重新打开弹窗查看');
      onClose();
    } catch { message.error('同步失败'); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      setAllPermissions([]);
      setGrantedIds(new Set());
      setPage(0);
      Promise.all([
        adminPermissionService.list({ page: 1, pageSize: 200 }),
        adminRoleService.getPermissions(roleId),
      ])
        .then(([permRes, rolePermRes]) => {
          if (permRes && typeof permRes === 'object') {
            const raw = permRes as unknown as Record<string, unknown>;
            const dataVal = raw.data;
            if (Array.isArray(dataVal)) {
              setAllPermissions(dataVal as unknown as PermissionInfo[]);
              setGrantedIds(new Set(dataVal.map((p: Record<string, unknown>) => String(p.id))));
            } else if (dataVal && typeof dataVal === 'object') {
              const inner = dataVal as Record<string, unknown>;
              const perms = inner.permissions;
              if (Array.isArray(perms)) {
                setAllPermissions(perms as PermissionInfo[]);
              }
            }
          }

          if (rolePermRes && typeof rolePermRes === 'object') {
            const roleRaw = rolePermRes as unknown as Record<string, unknown>;
            const roleData = roleRaw.data;
            if (Array.isArray(roleData)) {
              const granted = new Set(roleData.map((r: Record<string, unknown>) => String(r.id || r.roleId)));
              setGrantedIds(granted);
            } else if (roleData && typeof roleData === 'object') {
              const inner = roleData as Record<string, unknown>;
              const rolePerms = inner.permissions;
              if (Array.isArray(rolePerms)) {
                const granted = new Set(rolePerms.map((r: Record<string, unknown>) => String(r.id)));
                setGrantedIds(granted);
              }
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, roleId]);

  const handleToggle = (permId: string, checked: boolean) => {
    setGrantedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permId);
      else next.delete(permId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const freshRes = await adminRoleService.getPermissions(roleId);
      const freshBody = freshRes as unknown as { data: { permissions: PermissionInfo[] } };
      const originalIds = new Set(freshBody.data.permissions.map((p) => p.id));
      const grant: string[] = [];
      const revoke: string[] = [];

      for (const id of grantedIds) {
        if (!originalIds.has(id)) grant.push(id);
      }
      for (const id of originalIds) {
        if (!grantedIds.has(id)) revoke.push(id);
      }

      if (grant.length > 0 || revoke.length > 0) {
        await adminRoleService.updatePermissions(roleId, { grant, revoke });
      }
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
      onSuccess();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, PermissionInfo[]>,
  );

  const categoryEntries = Object.entries(groupedPermissions);
  const [page, setPage] = useState(0);
  const pageSize = 3; // categories per page
  const totalPages = Math.ceil(categoryEntries.length / pageSize);
  const pagedCategories = categoryEntries.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <Modal
      confirmLoading={saving}
      footer={[
        <Button key="sync" loading={syncing} onClick={handleSync}>🔄 同步权限</Button>,
        <Button key="cancel" onClick={onClose}>{t('actions.cancel')}</Button>,
        <Button key="ok" loading={saving} onClick={handleSave} type="primary">{t('actions.save')}</Button>,
      ]}
      onCancel={onClose}
      open={open}
      title={t('roles.permissionConfig')}
      width={600}
    >
      <div style={{ maxHeight: 500, overflow: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ alignItems: 'center', display: 'flex', height: 200, justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : allPermissions.length === 0 ? (
          <div style={{ alignItems: 'center', color: 'var(--ant-color-text-quaternary)', display: 'flex', fontSize: 13, height: 120, justifyContent: 'center' }}>
            {t('permissions.empty')}
          </div>
        ) : (
          <>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <Button disabled={page === 0} onClick={() => setPage(p => p - 1)} size="small">上一页</Button>
                <span style={{ lineHeight: '24px', fontSize: 13 }}>{page + 1} / {totalPages}</span>
                <Button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} size="small">下一页</Button>
              </div>
            )}
            {pagedCategories.map(([category, perms]) => (
              <div key={category} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ant-color-text-secondary)' }}>
                  {category}
                </div>
                {perms.map((perm) => (
                  <div key={perm.id} style={{ marginBottom: 4 }}>
                    <Checkbox
                    checked={grantedIds.has(perm.id)}
                    onChange={(e) => handleToggle(perm.id, e.target.checked)}
                  >
                    <Space>
                      <code style={{ fontSize: 12 }}>{perm.code}</code>
                      <span style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 12 }}>
                        {perm.name}
                      </span>
                    </Space>
                  </Checkbox>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
});

RolePermissionPanel.displayName = 'RolePermissionPanel';

export default RolePermissionPanel;
