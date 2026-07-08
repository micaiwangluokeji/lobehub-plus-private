import { z } from 'zod';

import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';
import { DictConfigsModel } from '@/database/models/dictConfigs';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      dictConfigsModel: new DictConfigsModel(ctx.serverDB),
    },
  });
});

const updateSystemConfigSchema = z.object({
  systemName: z.string().optional(),
  defaultLanguage: z.string().optional(),
  registrationEnabled: z.boolean().optional(),
  maxFileUploadSize: z.number().optional(),
  systemLogo: z.string().optional(),
  favicon: z.string().optional(),
  themeColor: z.string().optional(),
  primaryColor: z.string().optional(),
  neutralColor: z.string().optional(),
});

const getType = (value: unknown): 'string' | 'number' | 'boolean' | 'json' => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

export const businessConfigEndpoints = {
  updateSystemConfig: adminProcedure
    .input(updateSystemConfigSchema)
    .mutation(async ({ input, ctx }) => {
      const { dictConfigsModel } = ctx;

      for (const [key, value] of Object.entries(input)) {
        if (value === undefined) continue;

        const existing = await dictConfigsModel.getByKey(key);
        if (existing) {
          await dictConfigsModel.update(existing.id, { value });
        } else {
          await dictConfigsModel.create({
            key,
            value,
            label: key,
            group: 'system_settings',
            type: getType(value),
          });
        }
      }

      return { success: true };
    }),
};
