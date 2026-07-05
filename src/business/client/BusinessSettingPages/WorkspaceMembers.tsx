'use client';

import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Flexbox, FormGroup, Input, Text } from '@lobehub/ui';
import { DropdownMenu } from '@lobehub/ui/base-ui';
import { Button, Empty, Modal, Select, Spin, message } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';
import { useActiveWorkspaceId } from '@/business/client/hooks/useActiveWorkspaceId';
import { useFetchWorkspaceMembers } from '@/business/client/hooks/useFetchWorkspaceMembers';
import { useIsWorkspaceOwner } from '@/business/client/hooks/useIsWorkspaceOwner';
import { workspaceMemberService } from '@/services/workspaceMember';

const WorkspaceMembers = () => {
  const { t } = useTranslation('setting');
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: members, loading, refresh } = useFetchWorkspaceMembers();
  const isOwner = useIsWorkspaceOwner();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!activeWorkspaceId || !inviteEmail) return;

    try {
      setInviting(true);
      const result = await workspaceMemberService.invite({
        workspaceId: activeWorkspaceId,
        email: inviteEmail,
        role: inviteRole,
      });
      if (result.success) {
        message.success(result.type === 'direct_add' ? 'Member added successfully' : 'Invitation sent successfully');
        setInviteModalOpen(false);
        setInviteEmail('');
        setInviteRole('member');
        refresh();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: 'owner' | 'member' | 'viewer') => {
    if (!activeWorkspaceId) return;

    try {
      await workspaceMemberService.updateRole({
        workspaceId: activeWorkspaceId,
        userId,
        role,
      });
      message.success('Role updated successfully');
      refresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!activeWorkspaceId) return;

    Modal.confirm({
      title: 'Remove Member',
      content: 'Are you sure you want to remove this member from the workspace?',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await workspaceMemberService.remove({
            workspaceId: activeWorkspaceId,
            userId,
          });
          message.success('Member removed successfully');
          refresh();
        } catch (error: any) {
          message.error(error.message || 'Failed to remove member');
        }
      },
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'gold';
      case 'member':
        return 'blue';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <>
      <SettingHeader
        title={t('workspaceSetting.tab.members')}
        extra={
          isOwner && (
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setInviteModalOpen(true)}
            >
              Invite Member
            </Button>
          )
        }
      />
      <FormGroup collapsible={false} gap={0} title={t('workspaceSetting.tab.members')} variant="filled">
        <Flexbox gap={8} style={{ padding: '8px 0' }}>
          {loading ? (
            <Flexbox align="center" justify="center" style={{ height: 200 }}>
              <Spin indicator={<LoadingOutlined spin />} />
            </Flexbox>
          ) : members.length === 0 ? (
            <Empty description="No members yet" />
          ) : (
            members.map((member: any) => (
              <Flexbox
                key={member.id}
                align="center"
                gap={12}
                horizontal
                style={{ padding: '12px 16px' }}
              >
                <Avatar size={40} src={member.avatar} icon={<UserOutlined />}>
                  {member.fullName?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Flexbox flex={1} gap={4}>
                  <Text strong>{member.fullName || member.email}</Text>
                  <Text type="secondary" fontSize={12}>{member.email}</Text>
                </Flexbox>
                <Flexbox align="center" gap={12} horizontal>
                  <Text type="secondary" fontSize={12}>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                  {isOwner ? (
                    <DropdownMenu
                      items={[
                        { key: 'owner', label: 'Owner', onClick: () => handleUpdateRole(member.id, 'owner') },
                        { key: 'member', label: 'Member', onClick: () => handleUpdateRole(member.id, 'member') },
                        { key: 'viewer', label: 'Viewer', onClick: () => handleUpdateRole(member.id, 'viewer') },
                        { type: 'separator' as any },
                        { key: 'remove', label: 'Remove', danger: true, onClick: () => handleRemove(member.id) },
                      ]}
                    >
                      <Button size="small">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Button>
                    </DropdownMenu>
                  ) : (
                    <Text type="secondary" fontSize={12}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  )}
                </Flexbox>
              </Flexbox>
            ))
          )}
        </Flexbox>
      </FormGroup>

      <Modal
        title="Invite Member"
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setInviteModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={inviting}
            onClick={handleInvite}
            disabled={!inviteEmail}
          >
            Send Invitation
          </Button>,
        ]}
      >
        <Flexbox gap={16}>
          <Flexbox gap={8}>
            <Text strong>Email</Text>
            <Input
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </Flexbox>
          <Flexbox gap={8}>
            <Text strong>Role</Text>
            <Select
              value={inviteRole}
              onChange={setInviteRole}
              style={{ width: '100%' }}
              options={[
                { value: 'owner', label: 'Owner' },
                { value: 'member', label: 'Member' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          </Flexbox>
        </Flexbox>
      </Modal>
    </>
  );
};

export default WorkspaceMembers;
