import { workspaceService } from '@/services/workspace';
import { type StoreSetter } from '@/store/types';

import { type WorkspaceStore } from './store';

type Setter = StoreSetter<WorkspaceStore>;

type PublicActions<T> = { [K in keyof T]: T[K] };

export class WorkspaceAction {
  readonly #get: () => WorkspaceStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => WorkspaceStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  loadWorkspaces = async (): Promise<void> => {
    if (this.#get().isWorkspacesLoaded) return;

    const workspaces = await workspaceService.list();

    // Preserve the existing activeWorkspaceId — do NOT auto-select the first
    // workspace. Personal mode (`activeWorkspaceId = null`) is the default;
    // `useWorkspaceUrlSync` drives workspace activation from the URL.
    const activeWorkspaceId = this.#get().activeWorkspaceId;
    const activeWorkspace = activeWorkspaceId
      ? workspaces.find((w) => w.id === activeWorkspaceId) || null
      : null;

    this.#set(
      {
        workspaces,
        isWorkspacesLoaded: true,
        activeWorkspaceId,
        activeWorkspace,
      },
      false,
      'loadWorkspaces',
    );
  };

  setActiveWorkspace = (workspaceId: string): void => {
    const workspace = this.#get().workspaces.find((w) => w.id === workspaceId);
    this.#set(
      {
        activeWorkspaceId: workspaceId,
        activeWorkspace: workspace || null,
      },
      false,
      'setActiveWorkspace',
    );
  };

  /**
   * Clear the active workspace, returning to personal context
   * (`activeWorkspaceId = null`). Used when the URL has no workspace slug
   * (e.g. `/`, `/settings/...`).
   */
  clearActiveWorkspace = (): void => {
    this.#set(
      {
        activeWorkspaceId: null,
        activeWorkspace: null,
      },
      false,
      'clearActiveWorkspace',
    );
  };

  setActiveWorkspaceBySlug = (slug: string): void => {
    const workspace = this.#get().workspaces.find((w) => w.slug === slug);
    if (workspace) {
      this.#set(
        {
          activeWorkspaceId: workspace.id,
          activeWorkspace: workspace,
        },
        false,
        'setActiveWorkspaceBySlug',
      );
    }
  };

  refreshWorkspaces = async (): Promise<void> => {
    const workspaces = await workspaceService.list();

    // Preserve existing activeWorkspaceId — don't auto-fallback to first workspace.
    const currentActiveId = this.#get().activeWorkspaceId;
    const activeWorkspace = currentActiveId
      ? workspaces.find((w) => w.id === currentActiveId) || null
      : null;

    this.#set(
      {
        workspaces,
        activeWorkspace,
        activeWorkspaceId: activeWorkspace?.id || null,
      },
      false,
      'refreshWorkspaces',
    );
  };

  createWorkspace = async (params: {
    name: string;
    slug: string;
    description?: string;
    avatar?: string;
  }): Promise<void> => {
    await workspaceService.create(params);
    await this.refreshWorkspaces();
  };

  updateWorkspace = async (params: {
    id: string;
    name?: string;
    slug?: string;
    description?: string;
    avatar?: string;
  }): Promise<void> => {
    await workspaceService.update(params);
    await this.refreshWorkspaces();
  };

  deleteWorkspace = async (id: string): Promise<void> => {
    await workspaceService.delete(id);
    await this.refreshWorkspaces();
  };

  resetWorkspaces = (): void => {
    this.#set(
      {
        workspaces: [],
        isWorkspacesLoaded: false,
        activeWorkspaceId: null,
        activeWorkspace: null,
      },
      false,
      'resetWorkspaces',
    );
  };
}

export type WorkspaceActionType = PublicActions<WorkspaceAction>;

export const workspaceAction = (
  set: Setter,
  get: () => WorkspaceStore,
  api?: unknown,
) => new WorkspaceAction(set, get, api);
