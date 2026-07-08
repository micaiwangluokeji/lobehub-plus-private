import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { PluginModel } from '@/database/models/plugin';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { MCPService } from '@/server/services/mcp';

const mcpscopeProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const pluginModel = new PluginModel(opts.ctx.serverDB, opts.ctx.userId);
  return opts.next({ ctx: { ...opts.ctx, pluginModel } });
});

export const mcpscopeToolsRouter = router({
  executeAction: mcpscopeProcedure
    .input(
      z.object({
        identifier: z.string(),
        toolArgs: z.record(z.unknown()).optional(),
        toolSlug: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plugin = await ctx.pluginModel.findById(input.identifier);

      if (!plugin || !plugin.customParams?.mcpscope) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No Mcpscope connection found for "${input.identifier}".`,
        });
      }

      const mcpUrl = plugin.customParams.mcpscope.mcpUrl;

      if (!mcpUrl) {
        throw new TRPCError({
          code: 'NOT_CONFIGURED',
          message: `MCP URL not configured for "${input.identifier}".`,
        });
      }

      try {
        const mcpService = new MCPService({ url: mcpUrl });
        const result = await mcpService.callTool(input.toolSlug, input.toolArgs || {});

        return await MCPService.processToolCallResult({
          content: [{ text: JSON.stringify(result), type: 'text' }],
          isError: false,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return await MCPService.processToolCallResult({
          content: [{ text: errorMessage, type: 'text' }],
          isError: true,
        });
      }
    }),

  getActions: mcpscopeProcedure
    .input(z.object({ appSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const allPlugins = await ctx.pluginModel.query();
      const plugin = allPlugins.find((p) => p.customParams?.mcpscope?.appSlug === input.appSlug);

      if (!plugin?.manifest?.api) {
        return { tools: [] };
      }

      const tools = plugin.manifest.api.map((api) => ({
        description: api.description || '',
        inputSchema: api.parameters || { properties: {}, type: 'object' },
        name: api.name || '',
      }));

      return { tools };
    }),

  listActions: mcpscopeProcedure
    .input(z.object({ appSlug: z.string(), identifier: z.string() }))
    .query(async ({ ctx, input }) => {
      const plugin = await ctx.pluginModel.findById(input.identifier);

      if (!plugin?.manifest?.api) {
        return { tools: [] };
      }

      const tools = plugin.manifest.api.map((api) => ({
        description: api.description || '',
        inputSchema: api.parameters || { properties: {}, type: 'object' },
        name: api.name || '',
      }));

      return { tools };
    }),
});
