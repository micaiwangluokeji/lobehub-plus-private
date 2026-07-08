import { EdgeConfig } from '@lobechat/edge-config';
import debug from 'debug';
import { z } from 'zod';

import { withRbacPermission } from '@/business/server/trpc-middlewares/rbacPermission';
import { businessConfigEndpoints } from '@/business/server/lambda-routers/config';
import { DictConfigsModel } from '@/database/models/dictConfigs';
import { authedProcedure, publicProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import {
  getServerFeatureFlagsStateFromRuntimeConfig,
  publishFeatureFlags,
} from '@/server/featureFlags';
import { getServerDefaultAgentConfig, getServerGlobalConfig } from '@/server/globalConfig';
import {
  type GlobalBillboard,
  type GlobalBillboardItem,
  type GlobalRuntimeConfig,
} from '@/types/serverConfig';

const log = debug('config-router');

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeBillboardItem = (raw: unknown): GlobalBillboardItem | null => {
  if (!isObject(raw)) return null;
  if (typeof raw.title !== 'string') return null;
  if (typeof raw.description !== 'string') return null;
  return raw as unknown as GlobalBillboardItem;
};

const normalizeBillboard = (raw: unknown): GlobalBillboard | null => {
  if (!isObject(raw)) return null;
  if (typeof raw.slug !== 'string' || raw.slug.length === 0) return null;
  if (typeof raw.title !== 'string') return null;
  if (typeof raw.startAt !== 'string' || typeof raw.endAt !== 'string') return null;
  if (!Array.isArray(raw.items)) return null;

  const items = raw.items
    .map((item) => normalizeBillboardItem(item))
    .filter((item): item is GlobalBillboardItem => item !== null);

  return { ...(raw as unknown as GlobalBillboard), items };
};

const getActiveBillboard = async (): Promise<GlobalBillboard | null> => {
  if (!EdgeConfig.isEnabled()) return null;
  try {
    const data = await new EdgeConfig().getBillboards();
    if (!data) return null;
    const normalized = normalizeBillboard(data);
    if (!normalized) {
      log('[Billboard] EdgeConfig payload failed validation, ignoring:', data);
      return null;
    }
    return normalized;
  } catch (err) {
    log('[Billboard] Failed to read from EdgeConfig:', err);
    return null;
  }
};

const NAV_ITEM_IDS = [
  'home',
  'discover',
  'tasks',
  'pages',
  'image',
  'resource',
  'memory',
  'community',
  'settings',
  'profile',
  'appearance',
  'provider',
  'apikey',
  'about',
  'stats',
] as const;
const NAV_ROLES = ['free_user', 'pro_user', 'vip_user'] as const;

const navVisibilitySchema = z.object(
  Object.fromEntries(
    NAV_ITEM_IDS.flatMap((navId) => NAV_ROLES.map((role) => [`${navId}_${role}`, z.boolean()])),
  ),
);

const adminProcedure = authedProcedure
  .use(serverDatabase)
  .use(withRbacPermission('agent:update:all'));

export const configRouter = router({
  getDefaultAgentConfig: publicProcedure.query(async () => {
    return getServerDefaultAgentConfig();
  }),

  getGlobalConfig: publicProcedure.use(serverDatabase).query(async ({ ctx }) => {
    log('[GlobalConfig] Starting global config retrieval for user:', ctx.userId || 'anonymous');

    const [serverConfig, serverFeatureFlags, billboard] = await Promise.all([
      getServerGlobalConfig(),
      getServerFeatureFlagsStateFromRuntimeConfig(ctx.userId || undefined),
      getActiveBillboard(),
    ]);

    // Read system settings from dict_configs (stored by the admin settings page)
    let systemSettings: Record<string, unknown> = {};
    try {
      const dictConfigsModel = new DictConfigsModel(ctx.serverDB);
      const rows = await dictConfigsModel.getByGroup('system_settings');
      for (const item of rows) {
        systemSettings[item.key] = item.value;
      }
    } catch (err) {
      log('[GlobalConfig] Failed to read system settings from dict_configs:', err);
    }

    log('[GlobalConfig] Server config retrieved');

    return {
      billboard,
      serverConfig,
      serverFeatureFlags,
      ...systemSettings,
    } as GlobalRuntimeConfig;
  }),

  /**
   * Update navigation visibility configuration per role.
   * Only super_admin (agent:update:all) can call this.
   */
  updateNavVisibility: adminProcedure.input(navVisibilitySchema).mutation(async ({ input }) => {
    log('[Config] Updating nav visibility: %O', input);

    const patch: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(input)) {
      // key = 'home_free_user' → flag: 'nav_home_for_free_user'
      const [navId, ...roleParts] = key.split('_');
      const role = roleParts.join('_'); // handles role names with underscores e.g. free_user
      patch[`nav_${navId}_for_${role}`] = value;
    }

    await publishFeatureFlags(patch);

    return { success: true };
  }),

  ...businessConfigEndpoints,
});
