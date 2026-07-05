'use client';

import { Button, Flexbox, Tag, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserRoles } from '@/hooks/useUserRoles';

import ProfileRow from './ProfileRow';

const styles = createStaticStyles(({ css, cssVar }) => ({
  description: css`
    font-size: 12px;
    color: ${cssVar.colorTextDescription};
  `,
  tag: css`
    margin: 0;
  `,
}));

const ROLE_TAG_COLOR: Record<'super_admin' | 'pro_user' | 'vip_user' | 'free_user', string> = {
  free_user: 'default',
  pro_user: 'cyan',
  super_admin: 'gold',
  vip_user: 'purple',
};

/**
 * Displays the current user's primary RBAC role on the profile settings page.
 *
 * - super_admin / vip_user: read-only tag + description.
 * - free_user: tag + description + a placeholder "Upgrade to VIP" entry point.
 *   The upgrade action is intentionally a placeholder for now — billing flow is
 *   out of scope for Phase 1; wiring it up later only needs to change the
 *   `onUpgrade` handler below.
 */
const RoleRow = memo(() => {
  const { t } = useTranslation('auth');
  const { primaryRole, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <ProfileRow label={t('profile.role')}>
        <Text type="secondary">--</Text>
      </ProfileRow>
    );
  }

  const handleUpgrade = () => {
    // Placeholder: billing/upgrade flow will be wired up in a later phase.
    // Intentionally a no-op for now so the entry point is visible but safe.
    window.open('/settings/billing', '_blank');
  };

  return (
    <ProfileRow label={t('profile.role')}>
      <Flexbox align="center" gap={8} horizontal>
        <Tag className={styles.tag} color={ROLE_TAG_COLOR[primaryRole]}>
          {t(`profile.role.${primaryRole}`)}
        </Tag>
        <Text className={styles.description}>
          {t(`profile.role.description.${primaryRole}`)}
        </Text>
        {primaryRole === 'free_user' && (
          <Button
            onClick={handleUpgrade}
            size="small"
            title={t('profile.role.upgradeTooltip')}
            type="primary"
          >
            {t('profile.role.upgrade')}
          </Button>
        )}
      </Flexbox>
    </ProfileRow>
  );
});

export default RoleRow;
