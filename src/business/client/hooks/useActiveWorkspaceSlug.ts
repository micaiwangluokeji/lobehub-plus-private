import { useEffect } from 'react';

import { getWorkspaceStoreState, useWorkspaceStore } from '@/store/workspace';

export const getActiveWorkspaceSlug = (): string | null => {
  const state = getWorkspaceStoreState();
  return state.activeWorkspace?.slug || null;
};

export const useActiveWorkspaceSlug = (): string | null => {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isWorkspacesLoaded = useWorkspaceStore((s) => s.isWorkspacesLoaded);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    if (!isWorkspacesLoaded) {
      loadWorkspaces();
    }
  }, [isWorkspacesLoaded, loadWorkspaces]);

  return activeWorkspace?.slug || null;
};
