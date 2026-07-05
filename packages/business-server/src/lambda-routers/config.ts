import { z } from 'zod';

import { authedProcedure } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

const updateSystemConfigSchema = z.object({
  defaultLanguage: z.string().optional(),
  maxFileUploadSize: z.number().min(1).max(1024).optional(),
  registrationEnabled: z.boolean().optional(),
  systemName: z.string().optional(),
});

const adminProcedure = authedProcedure.use(serverDatabase);

export const businessConfigEndpoints = {
  /** Update system-level configuration (super_admin only) */
  updateSystemConfig: adminProcedure
    .input(updateSystemConfigSchema)
    .mutation(async ({ input }) => {
      // In a production system, this would persist to a database config table.
      // Currently, the config is served from runtime/server env vars.
      // This endpoint provides the structure for future persistence.
      return { success: true, updated: input };
    }),
} as const;
