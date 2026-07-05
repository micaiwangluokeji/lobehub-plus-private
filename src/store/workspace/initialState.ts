import type { WorkspaceItem } from '@lobechat/database/schemas';

export type WorkspaceListItem = WorkspaceItem & {
  lockedOut?: boolean;
  plan?: 'business' | 'free' | 'pro';
  role?: string;
};

export interface WorkspaceState {
  workspaces: WorkspaceListItem[];
  isWorkspacesLoaded: boolean;
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceListItem | null;
}

export const initialState: WorkspaceState = {
  workspaces: [],
  isWorkspacesLoaded: false,
  activeWorkspaceId: null,
  activeWorkspace: null,
};
