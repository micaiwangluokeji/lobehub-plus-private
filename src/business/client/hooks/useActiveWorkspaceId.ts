import { useEffect } from 'react';

import { getWorkspaceStoreState, useWorkspaceStore } from '@/store/workspace';

export const getActiveWorkspaceId = (): string | null => {
  const state = getWorkspaceStoreState();
  return state.activeWorkspaceId;
};

export const useActiveWorkspaceId = (): string | null => {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const isWorkspacesLoaded = useWorkspaceStore((s) => s.isWorkspacesLoaded);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    if (!isWorkspacesLoaded) {
      loadWorkspaces();
    }
  }, [isWorkspacesLoaded, loadWorkspaces]);

  return activeWorkspaceId;
};
