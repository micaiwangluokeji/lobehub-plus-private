import { z } from 'zod';

// ==================== Settings Types ====================

export type SettingsResponse = Record<string, unknown>;

export type UpdateSettingsRequest = {
  key?: string;
  value?: unknown;
} & Record<string, unknown>;

export const UpdateSettingsRequestSchema = z
  .object({
    key: z.string().optional(),
    value: z.any().optional(),
  })
  .catchall(z.any());
