import { useEffect } from 'react';

import { useWorkspaceStore } from '@/store/workspace';

export const useIsWorkspaceLoading = (): boolean => {
  const isWorkspacesLoaded = useWorkspaceStore((s) => s.isWorkspacesLoaded);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    if (!isWorkspacesLoaded) {
      loadWorkspaces();
    }
  }, [isWorkspacesLoaded, loadWorkspaces]);

  return !isWorkspacesLoaded;
};
