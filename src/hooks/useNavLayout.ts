import { HomeIcon, SearchIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspaceSlug } from '@/business/client/hooks/useActiveWorkspaceSlug';
import { getRouteById } from '@/config/routes';
import { usePermission } from '@/hooks/usePermission';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

export interface NavItem {
  hidden?: boolean;
  icon: any;
  isNew?: boolean;
  key: string;
  onClick?: () => void;
  title: string;
  url?: string;
}

export interface NavLayout {
  bottomMenuItems: NavItem[];
  footer: {
    hideGitHub: boolean;
    layout: 'expanded' | 'compact';
    showEvalEntry: boolean;
    showSettingsEntry: boolean;
  };
  topNavItems: NavItem[];
  userPanel: {
    showDataImporter: boolean;
    showMemory: boolean;
  };
}

export const useNavLayout = (): NavLayout => {
  const { t } = useTranslation('common');
  const toggleCommandMenu = useGlobalStore((s) => s.toggleCommandMenu);
  const featureFlags = useServerConfigStore(featureFlagsSelectors);
  const { showMarket, hideGitHub } = featureFlags;
  const activeWorkspaceSlug = useActiveWorkspaceSlug();
  const { allowed: canManageOfficial } = usePermission('manage_official_agents');
  const { primaryRole } = useUserRoles();

  const isNavVisibleForRole = useMemo(() => {
    const roleSuffix =
      primaryRole === 'super_admin'
        ? null // super_admin always sees everything
        : primaryRole === 'vip_user'
          ? 'ForVipUser'
          : primaryRole === 'pro_user'
            ? 'ForProUser'
            : 'ForFreeUser';

    return (navId: string) => {
      if (!roleSuffix) return true; // super_admin sees all
      const flagKey =
        `showNav${navId.charAt(0).toUpperCase()}${navId.slice(1)}${roleSuffix}` as keyof typeof featureFlags;
      return featureFlags[flagKey] !== false;
    };
  }, [primaryRole, featureFlags]);

  const topNavItems = useMemo(
    () =>
      [
        {
          icon: SearchIcon,
          key: 'search',
          onClick: () => toggleCommandMenu(true),
          title: t('tab.search'),
        },
        {
          hidden: !isNavVisibleForRole('home'),
          icon: HomeIcon,
          key: SidebarTabKey.Home,
          title: t('tab.home'),
          url: '/',
        },
        {
          hidden: !isNavVisibleForRole('discover'),
          icon: getRouteById('discover')?.icon || getRouteById('community')!.icon,
          key: SidebarTabKey.Discover,
          title: t('tab.discover'),
          url: '/discover/agent',
        },
        {
          hidden: !isNavVisibleForRole('tasks'),
          icon: getRouteById('tasks')!.icon,
          key: SidebarTabKey.Tasks,
          title: t('tab.tasks'),
          url: '/tasks',
        },
        {
          hidden: !isNavVisibleForRole('pages'),
          icon: getRouteById('page')!.icon,
          key: SidebarTabKey.Pages,
          title: t('tab.pages'),
          url: '/page',
        },
      ] as NavItem[],
    [t, toggleCommandMenu, showMarket, isNavVisibleForRole],
  );

  const bottomMenuItems = useMemo(
    () =>
      [
        {
          hidden: !isNavVisibleForRole('image'),
          icon: getRouteById('image')!.icon,
          key: SidebarTabKey.Image,
          title: t('tab.generation'),
          url: '/image',
        },
        {
          hidden: !showMarket || !isNavVisibleForRole('community'),
          icon: getRouteById('community')!.icon,
          key: SidebarTabKey.Community,
          title: t('tab.community'),
          url: '/community',
        },
        {
          hidden: !isNavVisibleForRole('resource'),
          icon: getRouteById('resource')!.icon,
          key: SidebarTabKey.Resource,
          title: t('tab.resource'),
          url: '/resource',
        },
        {
          hidden: !!activeWorkspaceSlug || !isNavVisibleForRole('memory'),
          icon: getRouteById('memory')!.icon,
          key: SidebarTabKey.Memory,
          title: t('tab.memory'),
          url: '/memory',
        },
      ] as NavItem[],
    [t, showMarket, canManageOfficial, activeWorkspaceSlug, isNavVisibleForRole],
  );

  const footer = useMemo(
    () => ({
      hideGitHub: !!hideGitHub,
      layout: 'compact' as const,
      showEvalEntry: false,
      showSettingsEntry: isNavVisibleForRole('settings'),
    }),
    [hideGitHub, isNavVisibleForRole],
  );

  const userPanel = useMemo(
    () => ({
      showDataImporter: false,
      // Memory now appears in the sidebar by default; drop the duplicate entry
      // from the user dropdown to keep that menu focused on account / settings.
      showMemory: false,
    }),
    [],
  );

  return { bottomMenuItems, footer, topNavItems, userPanel };
};
