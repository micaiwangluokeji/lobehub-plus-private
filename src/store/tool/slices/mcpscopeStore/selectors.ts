import { type ToolStore } from '../../store';
import { type McpscopeServer, McpscopeServerStatus } from './types';

export const mcpscopeStoreSelectors = {
  getAllServerIdentifiers: (s: ToolStore): Set<string> => {
    const servers = s.mcpscopeServers || [];
    return new Set(servers.map((server) => server.identifier));
  },

  getAllTools: (s: ToolStore) => {
    const connectedServers = mcpscopeStoreSelectors.getConnectedServers(s);
    return connectedServers.flatMap((server) =>
      (server.tools || []).map((tool) => ({
        ...tool,
        appSlug: server.appSlug,
      })),
    );
  },

  getConnectedServers: (s: ToolStore): McpscopeServer[] =>
    (s.mcpscopeServers || []).filter((server) => server.status === McpscopeServerStatus.ACTIVE),

  getServerByIdentifier: (identifier: string) => (s: ToolStore) =>
    s.mcpscopeServers?.find((server) => server.identifier === identifier),

  getServers: (s: ToolStore): McpscopeServer[] => s.mcpscopeServers || [],

  isMcpscopeServer:
    (identifier: string) =>
    (s: ToolStore): boolean => {
      const servers = s.mcpscopeServers || [];
      return servers.some((server) => server.identifier === identifier);
    },

  isServerLoading: (identifier: string) => (s: ToolStore) =>
    s.loadingMcpscopeServerIds?.has(identifier) || false,

  isToolExecuting: (identifier: string, toolSlug: string) => (s: ToolStore) => {
    const toolId = `${identifier}:${toolSlug}`;
    return s.mcpscopeExecutingToolIds?.has(toolId) || false;
  },

  mcpscopeAsLobeTools: (s: ToolStore) => {
    const servers = s.mcpscopeServers || [];
    const tools: any[] = [];

    servers.forEach((server) => {
      if (!server.tools || server.status !== McpscopeServerStatus.ACTIVE) return;

      const apis = server.tools.map((tool) => ({
        description: tool.description || '',
        name: tool.name,
        parameters: tool.inputSchema || {},
      }));

      if (apis.length > 0) {
        tools.push({
          identifier: server.identifier,
          manifest: {
            api: apis,
            author: 'ModelScope',
            homepage: 'https://modelscope.cn',
            identifier: server.identifier,
            meta: {
              avatar: '☁️',
              description: `ModelScope: ${server.label}`,
              tags: ['mcpscope', 'mcp'],
              title: server.label,
            },
            type: 'builtin',
            version: '1.0.0',
          },
          type: 'plugin',
        });
      }
    });

    return tools;
  },
};
