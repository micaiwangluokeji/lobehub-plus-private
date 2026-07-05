import { useNavigate } from 'react-router';

import { useWorkspaceStore } from '@/store/workspace';

export interface SwitchWorkspaceActions {
  switchToPersonal: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
}

export const useSwitchWorkspace = (): SwitchWorkspaceActions => {
  const navigate = useNavigate();
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const clearActiveWorkspace = useWorkspaceStore((s) => s.clearActiveWorkspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const switchWorkspace = async (id: string) => {
    setActiveWorkspace(id);
    const workspace = workspaces.find((w) => w.id === id);
    if (workspace) {
      navigate(`/${workspace.slug}/`);
    }
  };

  const switchToPersonal = async () => {
    clearActiveWorkspace();
    navigate('/');
  };

  return { switchToPersonal, switchWorkspace };
};

export const useSilentSwitchWorkspace = (): SwitchWorkspaceActions => {
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const clearActiveWorkspace = useWorkspaceStore((s) => s.clearActiveWorkspace);

  const switchWorkspace = async (id: string) => {
    setActiveWorkspace(id);
  };

  const switchToPersonal = async () => {
    clearActiveWorkspace();
  };

  return { switchToPersonal, switchWorkspace };
};
