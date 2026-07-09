import { MCOPSCOPE_APP_TYPES } from '@lobechat/const';
import { produce } from 'immer';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';

import { toolKeys } from '@/libs/swr/keys';
import { lambdaClient, toolsClient } from '@/libs/trpc/client';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { type ToolStore } from '../../store';
import { type McpscopeStoreState } from './initialState';
import {
  type CallMcpscopeToolParams,
  type CallMcpscopeToolResult,
  type CreateMcpscopeServerParams,
  McpscopeServerStatus,
  type McpscopeServer,
  type McpscopeTool,
} from './types';

const n = setNamespace('mcpscopeStore');

const VALID_MCOPSCOPE_IDENTIFIERS = new Set(MCOPSCOPE_APP_TYPES.map((t) => t.identifier));

type Setter = StoreSetter<ToolStore>;
export const createMcpscopeStoreSlice = (set: Setter, get: () => ToolStore, _api?: unknown) =>
  new McpscopeStoreActionImpl(set, get, _api);

export class McpscopeStoreActionImpl {
  readonly #get: () => ToolStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ToolStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  callMcpscopeTool = async (params: CallMcpscopeToolParams): Promise<CallMcpscopeToolResult> => {
    const { identifier, toolSlug, toolArgs } = params;

    const toolId = `${identifier}:${toolSlug}`;

    this.#set(
      produce((draft: McpscopeStoreState) => {
        draft.mcpscopeExecutingToolIds.add(toolId);
      }),
      false,
      n('callMcpscopeTool/start'),
    );

    try {
      const response = await toolsClient.mcpscope.executeAction.mutate({
        identifier,
        toolArgs,
        toolSlug,
      });

      this.#set(
        produce((draft: McpscopeStoreState) => {
          draft.mcpscopeExecutingToolIds.delete(toolId);
        }),
        false,
        n('callMcpscopeTool/success'),
      );

      return { data: response, success: true };
    } catch (error) {
      console.error('[Mcpscope] Failed to call tool:', error);

      this.#set(
        produce((draft: McpscopeStoreState) => {
          draft.mcpscopeExecutingToolIds.delete(toolId);
        }),
        false,
        n('callMcpscopeTool/error'),
      );

      return {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      };
    }
  };

  createMcpscopeConnection = async (
    params: CreateMcpscopeServerParams,
  ): Promise<McpscopeServer | undefined> => {
    const { appSlug, identifier, label, mcpUrl, envVars } = params;

    this.#set(
      produce((draft: McpscopeStoreState) => {
        draft.loadingMcpscopeServerIds.add(identifier);
      }),
      false,
      n('createMcpscopeConnection/start'),
    );

    try {
      const response = await lambdaClient.mcpscope.createConnection.mutate({
        appSlug,
        identifier,
        label,
        mcpUrl,
        envVars,
      });

      const server: McpscopeServer = {
        appSlug,
        createdAt: Date.now(),
        identifier: response.identifier,
        label,
        mcpUrl: response.mcpUrl,
        status: McpscopeServerStatus.ACTIVE,
      };

      this.#set(
        produce((draft: McpscopeStoreState) => {
          const existingIndex = draft.mcpscopeServers.findIndex((s) => s.identifier === identifier);
          if (existingIndex >= 0) {
            draft.mcpscopeServers[existingIndex] = server;
          } else {
            draft.mcpscopeServers.push(server);
          }
          draft.loadingMcpscopeServerIds.delete(identifier);
        }),
        false,
        n('createMcpscopeConnection/success'),
      );

      return server;
    } catch (error) {
      console.error('[Mcpscope] Failed to create connection:', error);

      this.#set(
        produce((draft: McpscopeStoreState) => {
          draft.loadingMcpscopeServerIds.delete(identifier);
        }),
        false,
        n('createMcpscopeConnection/error'),
      );

      return undefined;
    }
  };

  refreshMcpscopeConnectionStatus = async (identifier: string): Promise<void> => {
    const { mcpscopeServers } = this.#get();

    const server = mcpscopeServers.find((s) => s.identifier === identifier);
    if (!server) {
      console.error('[Mcpscope] Server not found:', identifier);
      return;
    }

    this.#set(
      produce((draft: McpscopeStoreState) => {
        draft.loadingMcpscopeServerIds.add(identifier);
      }),
      false,
      n('refreshMcpscopeConnectionStatus/start'),
    );

    try {
      const connectionStatus = await lambdaClient.mcpscope.getConnection.query({
        identifier,
      });

      if (connectionStatus.status !== 'ACTIVE') {
        this.#set(
          produce((draft: McpscopeStoreState) => {
            const serverIndex = draft.mcpscopeServers.findIndex((s) => s.identifier === identifier);
            if (serverIndex >= 0) {
              draft.mcpscopeServers[serverIndex].status = McpscopeServerStatus.DISCONNECTED;
            }
            draft.loadingMcpscopeServerIds.delete(identifier);
          }),
          false,
          n('refreshMcpscopeConnectionStatus/notActive'),
        );
        return;
      }

      const toolsResponse = await toolsClient.mcpscope.listActions.query({
        appSlug: server.appSlug,
        identifier,
      });

      const tools = toolsResponse.tools as McpscopeTool[];

      this.#set(
        produce((draft: McpscopeStoreState) => {
          const serverIndex = draft.mcpscopeServers.findIndex((s) => s.identifier === identifier);
          if (serverIndex >= 0) {
            draft.mcpscopeServers[serverIndex].tools = tools;
            draft.mcpscopeServers[serverIndex].status = McpscopeServerStatus.ACTIVE;
            draft.mcpscopeServers[serverIndex].errorMessage = undefined;
          }
          draft.loadingMcpscopeServerIds.delete(identifier);
        }),
        false,
        n('refreshMcpscopeConnectionStatus/success'),
      );
    } catch (error) {
      console.error('[Mcpscope] Failed to refresh connection status:', error);

      this.#set(
        produce((draft: McpscopeStoreState) => {
          const serverIndex = draft.mcpscopeServers.findIndex((s) => s.identifier === identifier);
          if (serverIndex >= 0) {
            draft.mcpscopeServers[serverIndex].status = McpscopeServerStatus.ERROR;
            draft.mcpscopeServers[serverIndex].errorMessage =
              error instanceof Error ? error.message : String(error);
          }
          draft.loadingMcpscopeServerIds.delete(identifier);
        }),
        false,
        n('refreshMcpscopeConnectionStatus/error'),
      );
    }
  };

  removeMcpscopeConnection = async (identifier: string): Promise<void> => {
    const { mcpscopeServers } = this.#get();
    const server = mcpscopeServers.find((s) => s.identifier === identifier);

    this.#set(
      produce((draft: McpscopeStoreState) => {
        draft.mcpscopeServers = draft.mcpscopeServers.filter((s) => s.identifier !== identifier);
      }),
      false,
      n('removeMcpscopeConnection'),
    );

    if (server) {
      try {
        await lambdaClient.mcpscope.deleteConnection.mutate({
          identifier,
        });
      } catch (error) {
        console.error('[Mcpscope] Failed to delete connection:', error);
      }
    }
  };

  useFetchAppTools = (appSlug: string | undefined): SWRResponse<McpscopeTool[]> => {
    return useSWR<McpscopeTool[]>(
      appSlug ? toolKeys.mcpscopeAppTools(appSlug) : null,
      async () => {
        const response = await toolsClient.mcpscope.getActions.query({ appSlug: appSlug! });
        return (response.tools || []) as McpscopeTool[];
      },
      { fallbackData: [], revalidateOnFocus: false },
    );
  };

  useFetchUserMcpscopeConnections = (enabled: boolean): SWRResponse<McpscopeServer[]> => {
    return useSWR<McpscopeServer[]>(
      enabled ? toolKeys.mcpscopeConnections() : null,
      async () => {
        const mcpscopePlugins = await lambdaClient.mcpscope.getMcpscopePlugins.query();

        if (mcpscopePlugins.length === 0) return [];

        const validPlugins = mcpscopePlugins.filter((plugin) => plugin.customParams?.mcpscope);

        return validPlugins
          .filter((plugin) => VALID_MCOPSCOPE_IDENTIFIERS.has(plugin.identifier))
          .map((plugin) => {
            const params = plugin.customParams!.mcpscope!;
            const appType = MCOPSCOPE_APP_TYPES.find((t) => t.identifier === plugin.identifier);
            const tools: McpscopeTool[] = (plugin.manifest?.api || []).map((api) => ({
              description: api.description,
              inputSchema: api.parameters as McpscopeTool['inputSchema'],
              name: api.name,
            }));

            const statusMap: Record<string, McpscopeServerStatus> = {
              ACTIVE: McpscopeServerStatus.ACTIVE,
              DISCONNECTED: McpscopeServerStatus.DISCONNECTED,
              ERROR: McpscopeServerStatus.ERROR,
            };

            return {
              appSlug: params.appSlug || '',
              createdAt: plugin.createdAt || 0,
              identifier: plugin.identifier,
              label: appType?.label || plugin.identifier,
              mcpUrl: params.mcpUrl || '',
              status: statusMap[params.status] || McpscopeServerStatus.DISCONNECTED,
              tools,
            };
          });
      },
      {
        onSuccess: (data) => {
          this.#set(
            produce((draft: McpscopeStoreState) => {
              if (data.length > 0) {
                const existingIdentifiers = new Set(draft.mcpscopeServers.map((s) => s.identifier));
                const newServers = data.filter((s) => !existingIdentifiers.has(s.identifier));
                draft.mcpscopeServers = [...draft.mcpscopeServers, ...newServers];
              }
              draft.isMcpscopeServersInit = true;
            }),
            false,
            n('useFetchUserMcpscopeConnections'),
          );
        },
        revalidateOnFocus: false,
      },
    );
  };
}

export type McpscopeStoreAction = Pick<McpscopeStoreActionImpl, keyof McpscopeStoreActionImpl>;
