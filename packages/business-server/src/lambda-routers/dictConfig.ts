import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { DictConfigsModel } from '@/database/models/dictConfigs';

const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
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

export const dictConfigRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.dictConfigsModel.list();
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
