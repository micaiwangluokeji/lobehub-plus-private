import { useEffect, useState } from 'react';

import { useActiveWorkspaceId } from './useActiveWorkspaceId';
import { workspaceMemberService } from '@/services/workspaceMember';

export interface FetchWorkspaceMembersOptions {
  includeDeleted?: boolean;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  email?: string | null;
  fullName?: string | null;
  avatar?: string | null;
}

export const useFetchWorkspaceMembers = (
  options: FetchWorkspaceMembersOptions = {},
) => {
  const activeWorkspaceId = useActiveWorkspaceId();
  const [data, setData] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    setLoading(true);
    workspaceMemberService
      .list(activeWorkspaceId)
      .then((members) => {
        setData(members as WorkspaceMember[]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeWorkspaceId, options.includeDeleted]);

  const refresh = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const members = await workspaceMemberService.list(activeWorkspaceId);
      setData(members as WorkspaceMember[]);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, refresh };
};
