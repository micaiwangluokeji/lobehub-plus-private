import { useEffect } from 'react';

import { useWorkspaceStore } from '@/store/workspace';

export type { WorkspaceListItem } from '@/store/workspace/initialState';

export const useActiveWorkspace = () => {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isWorkspacesLoaded = useWorkspaceStore((s) => s.isWorkspacesLoaded);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    if (!isWorkspacesLoaded) {
      loadWorkspaces();
    }
  }, [isWorkspacesLoaded, loadWorkspaces]);

  return activeWorkspace;
};
