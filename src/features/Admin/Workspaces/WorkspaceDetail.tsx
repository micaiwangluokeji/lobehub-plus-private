'use client';

import { Descriptions, Modal, Spin, Table, Tag } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminWorkspaceInfo, AdminWorkspaceMember } from '@/services/admin/workspaces';
import { adminWorkspaceService } from '@/services/admin/workspaces';

interface WorkspaceDetailProps {
  onClose: () => void;
  open: boolean;
  workspaceId: string;
}

const WorkspaceDetail = memo<WorkspaceDetailProps>(({ onClose, open, workspaceId }) => {
  const { t } = useTranslation('admin');
  const [workspace, setWorkspace] = useState<AdminWorkspaceInfo | null>(null);
  const [members, setMembers] = useState<AdminWorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && workspaceId) {
      setLoading(true);
      Promise.all([
        adminWorkspaceService.getById(workspaceId),
        adminWorkspaceService.listMembers(workspaceId),
      ])
        .then(([wsRes, membersRes]) => {
          setWorkspace(wsRes as unknown as AdminWorkspaceInfo);
          setMembers(membersRes as unknown as AdminWorkspaceMember[]);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, workspaceId]);

  return (
    <Modal
      footer={null}
      onCancel={onClose}
      open={open}
      title={t('workspaces.detail')}
      width={640}
    >
      {loading ? (
        <div style={{ alignItems: 'center', display: 'flex', height: 200, justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : workspace ? (
        <>
          <Descriptions
            column={2}
            items={[
              { children: workspace.name, key: 'name', label: t('workspaces.columns.name') },
              { children: <code>{workspace.slug}</code>, key: 'slug', label: t('workspaces.columns.slug') },
              { children: workspace.primaryOwnerId || '-', key: 'owner', label: t('workspaces.columns.owner') },
              {
                children: workspace.frozen ? (
                  <Tag color="red">{t('workspaces.frozen')}</Tag>
                ) : (
                  <Tag color="green">{t('workspaces.active')}</Tag>
                ),
                key: 'status',
                label: t('workspaces.columns.status'),
              },
              {
                children: workspace.createdAt ? new Date(workspace.createdAt).toLocaleString() : '-',
                key: 'createdAt',
                label: t('workspaces.columns.createdAt'),
              },
              {
                children: workspace.description || '-',
                key: 'description',
                label: '描述',
              },
            ]}
            style={{ marginBottom: 24 }}
            title={t('workspaces.detail.basicInfo')}
          />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            {t('workspaces.detail.members')}
          </div>
          <Table<AdminWorkspaceMember>
            columns={[
              {
                dataIndex: 'userId',
                key: 'userId',
                title: '用户 ID',
              },
              {
                dataIndex: 'role',
                key: 'role',
                render: (role: string) => <Tag>{role}</Tag>,
                title: '角色',
              },
              {
                dataIndex: 'joinedAt',
                key: 'joinedAt',
                render: (val: string) => new Date(val).toLocaleString(),
                title: '加入时间',
              },
            ]}
            dataSource={members}
            locale={{ emptyText: t('workspaces.detail.noMembers') }}
            pagination={false}
            rowKey={(record) => `${record.workspaceId}-${record.userId}`}
            size="small"
          />
        </>
      ) : null}
    </Modal>
  );
});

WorkspaceDetail.displayName = 'WorkspaceDetail';

export default WorkspaceDetail;
