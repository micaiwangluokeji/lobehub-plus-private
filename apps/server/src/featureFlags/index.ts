import createDebug from 'debug';
import { z } from 'zod';

import type { IFeatureFlags } from '@/config/featureFlags';
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlagsSchema,
  getServerFeatureFlagsValue,
  mapFeatureFlagsEnvToState,
} from '@/config/featureFlags';
import type {
  RuntimeConfigDomain,
  RuntimeConfigProvider,
  RuntimeConfigSelector,
} from '@/server/runtimeConfig';
import {
  CompositeRuntimeConfigProvider,
  EnvRuntimeConfigProvider,
  RedisRuntimeConfigProvider,
} from '@/server/runtimeConfig';
import { merge } from '@/utils/merge';

const debug = createDebug('lobe:featureFlags');

const FEATURE_FLAGS_DOMAIN: RuntimeConfigDomain<IFeatureFlags> = {
  cacheTtlMs: 5000,
  getStorageKey: () => 'runtime-config:feature-flags:published',
  getVersionKey: () => 'runtime-config:feature-flags:version',
  key: 'feature-flags',
  schema: FeatureFlagsSchema,
};

const FEATURE_FLAG_OVERRIDE_DOMAIN: RuntimeConfigDomain<Record<string, boolean>> = {
  cacheTtlMs: 30_000,
  getStorageKey: (selector?: RuntimeConfigSelector) => {
    if (!selector || selector.scope !== 'user')
      return 'runtime-config:feature-flags:user:anonymous';

    return `runtime-config:feature-flags:user:${selector.id}`;
  },
  key: 'feature-flags-user-overrides',
  schema: z.record(z.string(), z.boolean()),
};

let featureFlagsProvider: RuntimeConfigProvider<IFeatureFlags> | null = null;
let featureFlagsOverrideProvider: RuntimeConfigProvider<Record<string, boolean>> | null = null;

const getFeatureFlagsProvider = () => {
  featureFlagsProvider ??= new CompositeRuntimeConfigProvider(
    new RedisRuntimeConfigProvider(FEATURE_FLAGS_DOMAIN),
    new EnvRuntimeConfigProvider(FEATURE_FLAGS_DOMAIN, {
      getSnapshotData: () => getServerFeatureFlagsValue(),
    }),
  );

  return featureFlagsProvider;
};

const getFeatureFlagOverrideProvider = () => {
  featureFlagsOverrideProvider ??= new RedisRuntimeConfigProvider(FEATURE_FLAG_OVERRIDE_DOMAIN);

  return featureFlagsOverrideProvider;
};

const getMergedFeatureFlags = async (userId?: string) => {
  const globalSnapshot = await getFeatureFlagsProvider().getSnapshot({ scope: 'global' });

  const globalFlags = merge(DEFAULT_FEATURE_FLAGS, globalSnapshot?.data || {});

  if (!userId) {
    return globalFlags;
  }

  const userOverrideSnapshot = await getFeatureFlagOverrideProvider().getSnapshot({
    id: userId,
    scope: 'user',
  });

  if (!userOverrideSnapshot) {
    return globalFlags;
  }

  return merge(globalFlags, userOverrideSnapshot.data as Partial<IFeatureFlags>);
};

/**
 * Get feature flags from RuntimeConfig with fallback to environment variables
 * @param userId - Optional user ID for user-specific feature flag evaluation
 */
export const getServerFeatureFlagsFromRuntimeConfig = async (userId?: string) => {
  const flags = await getMergedFeatureFlags(userId);

  debug('Using runtime feature flags for user: %s', userId || 'anonymous');

  return flags;
};

/**
 * Get server feature flags from RuntimeConfig and map them to state with user ID
 * @param userId - Optional user ID for user-specific feature flag evaluation
 */
export const getServerFeatureFlagsStateFromRuntimeConfig = async (userId?: string) => {
  const flags = await getServerFeatureFlagsFromRuntimeConfig(userId);
  return mapFeatureFlagsEnvToState(flags, userId);
};

/**
 * Publish updated feature flags to Redis, merging with the current published state.
 * Used by the admin nav-visibility config UI.
 */
export const publishFeatureFlags = async (patch: Partial<IFeatureFlags>) => {
  const redisProvider = new RedisRuntimeConfigProvider(FEATURE_FLAGS_DOMAIN);

  if (!redisProvider.isEnabled()) {
    debug('Redis not enabled, skipping feature flag publish');
    return;
  }

  const currentSnapshot = await redisProvider.getSnapshot({ scope: 'global' });
  const currentData = currentSnapshot?.data ?? {};

  const merged = merge(DEFAULT_FEATURE_FLAGS, currentData, patch);

  const parsed = FeatureFlagsSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`Invalid feature flags: ${parsed.error.message}`);
  }

  await redisProvider.publishSnapshot(parsed.data, { scope: 'global' });

  debug('Published feature flags patch: %O', patch);
};
