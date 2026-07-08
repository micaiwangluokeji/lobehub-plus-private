import { z } from 'zod';

import { router } from '@/libs/trpc/lambda';
import { adminGuardProcedure } from '@/business/server/trpc-middlewares/adminGuard';
import { WorkspaceModel } from '@/database/models/workspace';
import { workspaces } from '@/database/schemas/workspace';

const adminProcedure = adminGuardProcedure.use(async (opts) => {
  const { ctx } = opts;
  return opts.next({
    ctx: {
      workspaceModel: new WorkspaceModel(ctx.serverDB, ctx.userId),
    },
  });
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  frozen: z.boolean().optional(),
  frozenReason: z.string().optional(),
});

const getByIdSchema = z.object({
  id: z.string(),
});

const deleteSchema = z.object({
  id: z.string(),
});

export const workspaceRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const all = await ctx.serverDB.query.workspaces.findMany({
      orderBy: (ws, { desc }) => [desc(ws.updatedAt)],
    });
    return all;
  }),

  getById: adminProcedure.input(getByIdSchema).query(async ({ input, ctx }) => {
    const workspace = await ctx.serverDB.query.workspaces.findFirst({
      where: (ws, { eq }) => eq(ws.id, input.id),
    });
    return workspace;
  }),

  create: adminProcedure.input(createSchema).mutation(async ({ input, ctx }) => {
    const { workspaceModel } = ctx;
    return workspaceModel.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
    });
  }),

  update: adminProcedure.input(updateSchema).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.slug !== undefined) setData.slug = data.slug;
    if (data.description !== undefined) setData.description = data.description;
    if (data.frozen !== undefined) {
      setData.frozen = data.frozen;
      if (data.frozen) {
        setData.frozenAt = new Date();
        setData.frozenReason = data.frozenReason || null;
      } else {
        setData.frozenAt = null;
        setData.frozenReason = null;
      }
    }
    setData.updatedAt = new Date();

    const [updated] = await ctx.serverDB
      .update(workspaces)
      .set(setData)
      .where((ws, { eq }) => eq(ws.id, id))
      .returning();
    return updated;
  }),

  delete: adminProcedure.input(deleteSchema).mutation(async ({ input, ctx }) => {
    await ctx.serverDB.delete(workspaces).where((ws, { eq }) => eq(ws.id, input.id));
    return { success: true };
  }),
});
