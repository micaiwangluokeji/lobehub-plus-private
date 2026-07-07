import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { SettingsService } from '../services/settings.service';
import type { UpdateSettingsRequest } from '../types/settings.type';

/**
 * Settings controller class
 * Handles system settings HTTP requests and responses
 */
export class SettingsController extends BaseController {
  async getSettings(c: Context): Promise<Response> {
    try {
      const settingsService = new SettingsService();
      const result = await settingsService.getSettings();

      return this.success(c, result, 'Settings retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async updateSettings(c: Context): Promise<Response> {
    try {
      const body = await this.getBody<UpdateSettingsRequest>(c);

      if (!body) {
        return this.error(c, 'Request body cannot be empty', 400);
      }

      const settingsService = new SettingsService();
      const result = await settingsService.updateSettings(body);

      return this.success(c, result, 'Settings updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
