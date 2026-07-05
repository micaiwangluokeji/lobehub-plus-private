'use client';

import { Form, Input, Modal, Switch, message } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RbacRole, CreateRoleParams, UpdateRoleParams } from '@/services/admin/roles';
import { adminRoleService } from '@/services/admin/roles';

interface RoleFormProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  role: RbacRole | null;
}

const RoleForm = memo<RoleFormProps>(({ open, onClose, onSuccess, role }) => {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (role) {
        form.setFieldsValue({
          description: role.description,
          displayName: role.displayName,
          isActive: role.isActive,
          name: role.name,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, role, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (role) {
        const params: UpdateRoleParams = {
          description: values.description,
          displayName: values.displayName,
          isActive: values.isActive,
        };
        await adminRoleService.update(role.id, params);
      } else {
        const params: CreateRoleParams = {
          description: values.description,
          displayName: values.displayName,
          isActive: values.isActive ?? true,
          name: values.name,
        };
        await adminRoleService.create(params);
      }
      message.success(t('actions.save') + ' ' + t('actions.confirm'));
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
      title={role ? t('roles.edit') : t('roles.create')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t('roles.columns.name')}
          name="name"
          rules={[{ message: '请输入角色名称', required: true }]}
        >
          <Input disabled={!!role} />
        </Form.Item>
        <Form.Item label={t('roles.columns.displayName')} name="displayName">
          <Input />
        </Form.Item>
        <Form.Item label={t('roles.columns.description')} name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label={t('roles.columns.status')} name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
});

RoleForm.displayName = 'RoleForm';

export default RoleForm;
