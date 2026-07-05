import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { MembershipLevelsModel } from '@/database/models/membershipLevels';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      membershipLevelsModel: new MembershipLevelsModel(ctx.serverDB),
    },
  });
});

const createMembershipLevelSchema = z.object({
  name: z.string().min(1).max(64),
  slug: z.string().min(1).max(32),
  level: z.number().int().default(0),
  minRechargeTotal: z.number().min(0).default(0),
  monthlyCreditsBonus: z.number().int().default(0),
  storageBonusMB: z.number().int().default(0),
  features: z.array(z.string()).default([]),
  icon: z.string().max(64).optional(),
  color: z.string().max(16).optional(),
  enabled: z.boolean().default(true),
  sort: z.number().int().default(0),
});

const updateMembershipLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64).optional(),
  slug: z.string().min(1).max(32).optional(),
  level: z.number().int().optional(),
  minRechargeTotal: z.number().min(0).optional(),
  monthlyCreditsBonus: z.number().int().optional(),
  storageBonusMB: z.number().int().optional(),
  features: z.array(z.string()).optional(),
  icon: z.string().max(64).optional(),
  color: z.string().max(16).optional(),
  enabled: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export const membershipLevelRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.membershipLevelsModel.list();
  }),

  listEnabled: authedProcedure.use(serverDatabase).query(async ({ ctx }) => {
    const model = new MembershipLevelsModel(ctx.serverDB);
    return model.listEnabled();
  }),

  getById: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.membershipLevelsModel.getById(input);
  }),

  getBySlug: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.membershipLevelsModel.getBySlug(input);
  }),

  create: adminProcedure.input(createMembershipLevelSchema).mutation(async ({ input, ctx }) => {
    return ctx.membershipLevelsModel.create(input);
  }),

  update: adminProcedure.input(updateMembershipLevelSchema).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    return ctx.membershipLevelsModel.update(id, data);
  }),

  delete: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    await ctx.membershipLevelsModel.delete(input);
  }),
});
