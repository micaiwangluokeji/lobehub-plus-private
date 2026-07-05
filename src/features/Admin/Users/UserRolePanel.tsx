'use client';

import { Button, Checkbox, Modal, Space, Spin, message } from 'antd';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { adminUserService } from '@/services/admin/users';
import type { UserRole } from '@/services/admin/users';
import { adminRoleService, type RbacRole } from '@/services/admin/roles';

interface UserRolePanelProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  userId: string;
}

const UserRolePanel = memo<UserRolePanelProps>(({ open, onClose, onSuccess, userId }) => {
  const { t } = useTranslation('admin');
  const [allRoles, setAllRoles] = useState<RbacRole[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        adminRoleService.list({ page: 1, pageSize: 100 }),
        adminUserService.getRoles(userId),
      ])
        .then(([rolesRes, userRolesRes]) => {
          // API returns { data: { roles: [...], total: N }, ... }
          const rolesBody = rolesRes as unknown as { data: { roles: RbacRole[] } };
          setAllRoles(rolesBody.data.roles);
          // API returns { data: [{ roleId, roleName, ... }], ... }
          const rolesBody2 = userRolesRes as unknown as { data: { roleId: string }[] };
          setSelectedIds(new Set(rolesBody2.data.map((r) => r.roleId)));
        })
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  const handleToggle = useCallback((roleId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(roleId);
      else next.delete(roleId);
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch fresh data for diff
      const freshRes = await adminUserService.getRoles(userId);
      const freshBody = freshRes as unknown as { data: { roleId: string }[] };
      const originalIds = new Set(freshBody.data.map((r) => r.roleId));
      const addRoles: string[] = [];
      const removeRoles: string[] = [];

      for (const id of selectedIds) {
        if (!originalIds.has(id)) addRoles.push(id);
      }
      for (const id of originalIds) {
        if (!selectedIds.has(id)) removeRoles.push(id);
      }

      if (addRoles.length > 0 || removeRoles.length > 0) {
        await adminUserService.updateRoles(userId, { addRoles, removeRoles });
      }
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
      onSuccess();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      confirmLoading={saving}
      onCancel={onClose}
      onOk={handleSave}
      open={open}
      title={t('users.assignRoles')}
      width={480}
    >
      <div style={{ maxHeight: 400, overflow: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ alignItems: 'center', display: 'flex', height: 200, justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          allRoles.map((role) => (
            <div key={role.id} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={selectedIds.has(role.id)}
                onChange={(e) => handleToggle(role.id, e.target.checked)}
              >
                <Space>
                  <span>{role.name}</span>
                  {role.displayName && (
                    <span style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 12 }}>
                      ({role.displayName})
                    </span>
                  )}
                  {role.isSystem && (
                    <span style={{ color: 'var(--ant-color-primary)', fontSize: 12 }}>
                      [{t('roles.type.system')}]
                    </span>
                  )}
                </Space>
              </Checkbox>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
});

UserRolePanel.displayName = 'UserRolePanel';

export default UserRolePanel;
