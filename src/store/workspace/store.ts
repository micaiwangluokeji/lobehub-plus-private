import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { type StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type WorkspaceState, initialState } from './initialState';
import { type WorkspaceActionType, workspaceAction } from './action';

export interface WorkspaceStore extends WorkspaceState, WorkspaceActionType {}

const createStore: StateCreator<WorkspaceStore, [['zustand/devtools', never]]> = (
  ...parameters
) => ({
  ...initialState,
  ...flattenActions<WorkspaceActionType>([workspaceAction(...parameters)]),
});

const devtools = createDevtools('workspace');

export const useWorkspaceStore = createWithEqualityFn<WorkspaceStore>()(
  devtools(createStore),
  shallow,
);

expose('workspace', useWorkspaceStore);

export const getWorkspaceStoreState = () => useWorkspaceStore.getState();
