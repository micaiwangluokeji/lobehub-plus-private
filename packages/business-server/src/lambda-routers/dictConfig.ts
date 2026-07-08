import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { DictConfigsModel } from '@/database/models/dictConfigs';
import { seedDictConfigs } from '@/database/utils/seedDictConfigs';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      dictConfigsModel: new DictConfigsModel(ctx.serverDB),
    },
  });
});

const createDictConfigSchema = z.object({
  key: z.string().min(1).max(128),
  value: z.any(),
  label: z.string().min(1).max(256),
  group: z.string().max(64).default('general'),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  sort: z.number().int().default(0),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
});

const updateDictConfigSchema = z.object({
  id: z.string(),
  value: z.any().optional(),
  label: z.string().min(1).max(256).optional(),
  group: z.string().max(64).optional(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  sort: z.number().int().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

const listDictConfigSchema = z.object({
  keyword: z.string().optional(),
  group: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const dictConfigRouter = router({
  list: adminProcedure.input(listDictConfigSchema).query(async ({ input, ctx }) => {
    return ctx.dictConfigsModel.list(input);
  }),

  syncDefaults: adminProcedure.mutation(async ({ ctx }) => {
    const result = await seedDictConfigs(ctx.serverDB);
    return {
      success: true,
      total: result.total,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      message: `总计 ${result.total} 条，新增 ${result.created} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条`,
    };
  }),

  getByKey: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.dictConfigsModel.getByKey(input);
  }),

  getByGroup: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.dictConfigsModel.getByGroup(input);
  }),

  create: adminProcedure.input(createDictConfigSchema).mutation(async ({ input, ctx }) => {
    return ctx.dictConfigsModel.create(input);
  }),

  update: adminProcedure.input(updateDictConfigSchema).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    return ctx.dictConfigsModel.update(id, data);
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    await ctx.dictConfigsModel.delete(input);
  }),
});
