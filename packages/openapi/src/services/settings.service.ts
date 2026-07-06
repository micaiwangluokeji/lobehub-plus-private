import type { SettingsResponse, UpdateSettingsRequest } from '../types/settings.type';

/**
 * Settings service — system-wide settings access.
 *
 * No dedicated settings table exists yet, so reads return an empty object
 * and writes are accepted but not persisted (returns the provided payload).
 * When a settings table is introduced, swap these implementations to query it.
 */
export class SettingsService {
  async getSettings(): Promise<SettingsResponse> {
    return {};
  }

  async updateSettings(request: UpdateSettingsRequest): Promise<SettingsResponse> {
    // If a key/value pair is provided, return that single entry; otherwise echo back the object.
    if (request.key !== undefined) {
      return { [request.key]: request.value };
    }

    const { key: _key, value: _value, ...rest } = request;
    return rest;
  }
}
