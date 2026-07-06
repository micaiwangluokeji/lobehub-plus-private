import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { SettingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth';
import { UpdateSettingsRequestSchema } from '../types/settings.type';

const SettingsRoutes = new Hono();

/**
 * Get system settings
 * GET /api/v1/settings
 */
SettingsRoutes.get('/', requireAuth, async (c) => {
  const settingsController = new SettingsController();
  return await settingsController.getSettings(c);
});

/**
 * Update system settings
 * PATCH /api/v1/settings
 */
SettingsRoutes.patch(
  '/',
  requireAuth,
  zValidator('json', UpdateSettingsRequestSchema),
  async (c) => {
    const settingsController = new SettingsController();
    return await settingsController.updateSettings(c);
  },
);

export default SettingsRoutes;
