import { useEffect } from 'react';

import { useWorkspaceStore } from '@/store/workspace';

import type { WorkspaceListItem } from './useActiveWorkspace';

export const useWorkspaces = (): WorkspaceListItem[] => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isWorkspacesLoaded = useWorkspaceStore((s) => s.isWorkspacesLoaded);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  useEffect(() => {
    if (!isWorkspacesLoaded) {
      loadWorkspaces();
    }
  }, [isWorkspacesLoaded, loadWorkspaces]);

  return workspaces;
};
