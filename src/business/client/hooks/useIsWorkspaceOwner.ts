import { useEffect, useState } from 'react';

import { useActiveWorkspaceId } from './useActiveWorkspaceId';
import { workspaceMemberService } from '@/services/workspaceMember';

export const useIsWorkspaceOwner = (): boolean => {
  const activeWorkspaceId = useActiveWorkspaceId();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setIsOwner(false);
      return;
    }

    workspaceMemberService
      .getMyMembership(activeWorkspaceId)
      .then((membership) => {
        setIsOwner(membership?.role === 'owner');
      })
      .catch(() => {
        setIsOwner(false);
      });
  }, [activeWorkspaceId]);

  return isOwner;
};
