'use client';

import { type FormGroupItemType } from '@lobehub/ui';
import { Form } from '@lobehub/ui';
import { Switch } from '@lobehub/ui/base-ui';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSWRConfig } from 'swr';

import { FORM_STYLE } from '@/const/layoutTokens';
import { usePermission } from '@/hooks/usePermission';
import { globalService } from '@/services/global';
import { serverConfigKeys } from '@/libs/swr/keys';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

interface NavItemConfig {
  i18nKey: string;
  key: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { i18nKey: 'home', key: 'home' },
  { i18nKey: 'discover', key: 'discover' },
  { i18nKey: 'tasks', key: 'tasks' },
  { i18nKey: 'pages', key: 'pages' },
  { i18nKey: 'image', key: 'image' },
  { i18nKey: 'resource', key: 'resource' },
  { i18nKey: 'memory', key: 'memory' },
];

const ROLES = [
  { i18nKey: 'freeUser', key: 'free_user' },
  { i18nKey: 'vipUser', key: 'vip_user' },
] as const;

const NavVisibility = memo(() => {
  const { t } = useTranslation('setting');
  const { allowed: canManageOfficial } = usePermission('manage_official_agents');
  const featureFlags = useServerConfigStore(featureFlagsSelectors);
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);

  const getCurrentValue = useCallback(
    (navId: string, role: string) => {
      const flagKey =
        `showNav${navId.charAt(0).toUpperCase()}${navId.slice(1)}For${role === 'free_user' ? 'FreeUser' : 'VipUser'}` as keyof typeof featureFlags;
      return featureFlags[flagKey] !== false;
    },
    [featureFlags],
  );

  const handleToggle = useCallback(
    async (navId: string, role: string, checked: boolean) => {
      setLoading(true);
      try {
        await globalService.updateNavVisibility({
          [`${navId}_${role}`]: checked,
        });
        // Invalidate the global config cache so the store re-fetches and picks up updated feature flags
        await mutate(serverConfigKeys.get);
      } finally {
        setLoading(false);
      }
    },
    [mutate],
  );

  if (!canManageOfficial) return null;

  const roleGroups: FormGroupItemType[] = ROLES.map((role) => ({
    children: NAV_ITEMS.map((nav) => ({
      children: (
        <Switch
          checked={getCurrentValue(nav.key, role.key)}
          loading={loading}
          onChange={(checked: boolean) => handleToggle(nav.key, role.key, checked)}
        />
      ),
      label: t(`settingAppearance.navVisibility.${nav.i18nKey}` as any),
      minWidth: undefined,
    })),
    title: t(`settingAppearance.navVisibility.${role.i18nKey}` as any),
  }));

  return (
    <Form
      collapsible={false}
      items={roleGroups}
      itemsType={'group'}
      variant={'filled'}
      {...FORM_STYLE}
    />
  );
});

export default NavVisibility;
