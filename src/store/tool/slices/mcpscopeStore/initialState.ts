import { type McpscopeServer } from './types';

export interface McpscopeStoreState {
  mcpscopeExecutingToolIds: Set<string>;
  mcpscopeServers: McpscopeServer[];
  isMcpscopeServersInit: boolean;
  loadingMcpscopeServerIds: Set<string>;
}

export const initialMcpscopeStoreState: McpscopeStoreState = {
  mcpscopeExecutingToolIds: new Set(),
  mcpscopeServers: [],
  isMcpscopeServersInit: false,
  loadingMcpscopeServerIds: new Set(),
};
