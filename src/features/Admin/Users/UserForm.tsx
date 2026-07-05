'use client';

import { Form, Input, Modal, message } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUser, CreateUserParams, UpdateUserParams } from '@/services/admin/users';
import { adminUserService } from '@/services/admin/users';
import { adminRoleService, type RbacRole } from '@/services/admin/roles';

interface UserFormProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  user: AdminUser | null;
}

const UserForm = memo<UserFormProps>(({ open, onClose, onSuccess, user }) => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RbacRole[]>([]);

  useEffect(() => {
    if (open) {
      adminRoleService.list({ page: 1, pageSize: 100 }).then((res) => {
        setRoles(res.data);
      });
      if (user) {
        form.setFieldsValue({
          email: user.email,
          fullName: user.fullName,
          username: user.username,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, user, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (user) {
        const params: UpdateUserParams = {
          avatar: values.avatar,
          email: values.email,
          fullName: values.fullName,
          username: values.username,
        };
        await adminUserService.update(user.id, params);
      } else {
        const params: CreateUserParams = {
          email: values.email,
          fullName: values.fullName,
          username: values.username,
          roleIds: values.roleIds,
        };
        await adminUserService.create(params);
      }
      message.success(user ? t('actions.edit') + ' ' + t('actions.save') : t('users.create') + ' ' + t('actions.save'));
      onSuccess();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      confirmLoading={loading}
      onCancel={onClose}
      onOk={handleOk}
      open={open}
      title={user ? t('users.edit') : t('users.create')}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
      >
        <Form.Item label={t('users.columns.username')} name="username">
          <Input />
        </Form.Item>
        <Form.Item
          label={t('users.columns.email')}
          name="email"
          rules={[{ message: '请输入有效邮箱', type: 'email' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={t('users.columns.fullName')} name="fullName">
          <Input />
        </Form.Item>
        {!user && (
          <Form.Item label={t('users.assignRoles')} name="roleIds">
            <div style={{ color: 'var(--ant-color-text-quaternary)', fontSize: 12 }}>
              {roles.map((r) => r.name).join(', ')}
            </div>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
});

UserForm.displayName = 'UserForm';

export default UserForm;
