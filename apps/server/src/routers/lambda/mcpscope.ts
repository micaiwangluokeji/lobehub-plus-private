import { type ToolManifest } from '@lobechat/types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { PluginModel } from '@/database/models/plugin';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

const mcpscopeProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const pluginModel = new PluginModel(opts.ctx.serverDB, opts.ctx.userId);

  return opts.next({
    ctx: { ...opts.ctx, pluginModel },
  });
});

export const mcpscopeRouter = router({
  createConnection: mcpscopeProcedure
    .input(
      z.object({
        appSlug: z.string(),
        identifier: z.string(),
        label: z.string(),
        mcpUrl: z.string().optional(),
        envVars: z.record(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { appSlug, identifier, label, mcpUrl, envVars } = input;

      const manifest: ToolManifest = {
        api: [],
        identifier,
        meta: {
          avatar: '🔌',
          description: `Mcpscope: ${label}`,
          title: label,
        },
        type: 'default',
      };

      await ctx.pluginModel.create({
        customParams: {
          mcpscope: {
            appSlug,
            envVars: envVars || {},
            mcpUrl: mcpUrl || '',
            status: 'ACTIVE',
          },
        },
        identifier,
        manifest,
        source: 'mcpscope',
        type: 'plugin',
      });

      return {
        identifier,
        mcpUrl: mcpUrl || '',
      };
    }),

  deleteConnection: mcpscopeProcedure
    .input(
      z.object({
        identifier: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.pluginModel.delete(input.identifier);

      return { success: true };
    }),

  getMcpscopePlugins: mcpscopeProcedure.query(async ({ ctx }) => {
    const allPlugins = await ctx.pluginModel.query();
    return allPlugins.filter((plugin) => plugin.customParams?.mcpscope);
  }),

  getConnection: mcpscopeProcedure
    .input(
      z.object({
        identifier: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const plugin = await ctx.pluginModel.findById(input.identifier);

      if (!plugin || !plugin.customParams?.mcpscope) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Mcpscope connection not found for "${input.identifier}".`,
        });
      }

      return {
        identifier: plugin.identifier,
        status: plugin.customParams.mcpscope.status || 'DISCONNECTED',
      };
    }),

  updateMcpscopePlugin: mcpscopeProcedure
    .input(
      z.object({
        appSlug: z.string(),
        identifier: z.string(),
        label: z.string(),
        mcpUrl: z.string().optional(),
        status: z.string(),
        tools: z.array(
          z.object({
            description: z.string().optional(),
            inputSchema: z.any().optional(),
            name: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { identifier, label, appSlug, mcpUrl, tools, status } = input;

      const existingPlugin = await ctx.pluginModel.findById(identifier);

      const manifest: ToolManifest = {
        api: tools.map((tool) => ({
          description: tool.description || '',
          name: tool.name,
          parameters: tool.inputSchema || { properties: {}, type: 'object' },
        })),
        identifier,
        meta: existingPlugin?.manifest?.meta || {
          avatar: '🔌',
          description: `Mcpscope: ${label}`,
          title: label,
        },
        type: 'default',
      };

      const customParams = {
        mcpscope: { appSlug, mcpUrl: mcpUrl || '', status },
      };

      if (existingPlugin) {
        await ctx.pluginModel.update(identifier, { customParams, manifest });
      } else {
        await ctx.pluginModel.create({
          customParams,
          identifier,
          manifest,
          source: 'mcpscope',
          type: 'plugin',
        });
      }

      return { savedCount: tools.length };
    }),
});

export type McpscopeRouter = typeof mcpscopeRouter;
