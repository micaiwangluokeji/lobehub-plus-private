'use client';

import { type McpscopeAppType } from '@lobechat/const';
import {
  Avatar,
  Button as LobeButton,
  Center,
  DropdownMenu,
  Flexbox,
  Icon,
  Tooltip,
} from '@lobehub/ui';
import { confirmModal, createModal } from '@lobehub/ui/base-ui';
import { Button, Input } from 'antd';
import { cssVar } from 'antd-style';
import {
  CircleCheck,
  Loader2,
  MoreHorizontalIcon,
  SquareArrowOutUpRight,
  Unplug,
} from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NavItem from '@/features/NavPanel/components/NavItem';
import { usePermission } from '@/hooks/usePermission';
import { useToolStore } from '@/store/tool';
import { type McpscopeServer, McpscopeServerStatus } from '@/store/tool/slices/mcpscopeStore';

import { styles } from './style';

interface McpscopeSkillItemProps {
  isSelected?: boolean;
  onSelect?: () => void;
  server?: McpscopeServer;
  serverType: McpscopeAppType;
}

const { McpscopeConfigModal, showMcpscopeConfigModal, hideMcpscopeConfigModal } = createModal({
  title: '配置魔搭 MCP 服务',
});

const McpscopeSkillItem = memo<McpscopeSkillItemProps>(
  ({ serverType, server, isSelected, onSelect }) => {
    const { t } = useTranslation('setting');
    const { allowed: canCreate, reason: createReason } = usePermission('create_content');
    const { allowed: canEdit, reason: editReason } = usePermission('edit_own_content');
    const [isConnecting, setIsConnecting] = useState(false);

    const createMcpscopeConnection = useToolStore((s) => s.createMcpscopeConnection);
    const refreshMcpscopeConnectionStatus = useToolStore((s) => s.refreshMcpscopeConnectionStatus);
    const removeMcpscopeConnection = useToolStore((s) => s.removeMcpscopeConnection);

    const handleConnect = async () => {
      if (!canCreate || !canEdit) return;
      if (server) return;

      const envVars = serverType.envVars || [];

      showMcpscopeConfigModal({
        content: (
          <Flexbox vertical gap={16}>
            {envVars.map((envVar) => (
              <Input
                key={envVar}
                placeholder={`请输入 ${envVar}`}
                type="password"
                data-testid={`mcpscope-${serverType.identifier}-${envVar}`}
              />
            ))}
            <Input
              placeholder="请输入魔搭 MCP SSE URL（可选，留空使用默认）"
              data-testid={`mcpscope-${serverType.identifier}-mcpUrl`}
            />
          </Flexbox>
        ),
        okButtonProps: {
          onClick: async () => {
            setIsConnecting(true);
            try {
              const mcpUrl = serverType.mcpUrl || '';
              const newServer = await createMcpscopeConnection({
                appSlug: serverType.appSlug,
                identifier: serverType.identifier,
                label: serverType.label,
                mcpUrl,
              });

              if (newServer) {
                await refreshMcpscopeConnectionStatus(newServer.identifier);
              }
              hideMcpscopeConfigModal();
            } catch (error) {
              console.error('[Mcpscope] Failed to connect server:', error);
            } finally {
              setIsConnecting(false);
            }
          },
        },
      });
    };

    const handleDisconnect = () => {
      if (!canEdit) return;
      if (!server) return;
      confirmModal({
        cancelText: t('cancel', { ns: 'common' }),
        content: t('tools.mcpscope.disconnectConfirm.desc', { name: serverType.label }),
        okButtonProps: { danger: true },
        okText: t('tools.mcpscope.disconnect'),
        onOk: async () => {
          await removeMcpscopeConnection(server.identifier);
        },
        title: t('tools.mcpscope.disconnectConfirm.title', { name: serverType.label }),
      });
    };

    const renderIcon = () => {
      const { icon, label } = serverType;
      if (typeof icon === 'string') {
        return <Avatar alt={label} avatar={icon} size={16} />;
      }
      return <Icon fill={cssVar.colorText} icon={icon} size={16} />;
    };

    const renderStatus = () => {
      if (!server) {
        return (
          <span className={styles.disconnected}>
            {t('tools.mcpscope.disconnected', { defaultValue: 'Disconnected' })}
          </span>
        );
      }

      switch (server.status) {
        case McpscopeServerStatus.ACTIVE: {
          return <span className={styles.connected}>{t('tools.mcpscope.connected')}</span>;
        }
        case McpscopeServerStatus.ERROR: {
          return <span className={styles.error}>{t('tools.mcpscope.error')}</span>;
        }
        default: {
          return (
            <span className={styles.disconnected}>
              {t('tools.mcpscope.disconnected', { defaultValue: 'Disconnected' })}
            </span>
          );
        }
      }
    };

    const renderAction = () => {
      if (isConnecting) {
        return (
          <Button disabled icon={<Icon spin icon={Loader2} />} type="default">
            {t('tools.mcpscope.connect', { defaultValue: 'Connect' })}
          </Button>
        );
      }

      if (!server) {
        return (
          <Tooltip title={!canCreate ? createReason : editReason}>
            <Button
              disabled={!canCreate || !canEdit}
              icon={<Icon icon={SquareArrowOutUpRight} />}
              type="default"
              onClick={handleConnect}
            >
              {t('tools.mcpscope.connect', { defaultValue: 'Connect' })}
            </Button>
          </Tooltip>
        );
      }

      if (server.status === McpscopeServerStatus.ERROR) {
        return (
          <Tooltip title={!canCreate ? createReason : editReason}>
            <Button
              disabled={!canCreate || !canEdit}
              icon={<Icon icon={SquareArrowOutUpRight} />}
              type="default"
              onClick={handleConnect}
            >
              {t('tools.mcpscope.reconnect', { defaultValue: 'Reconnect' })}
            </Button>
          </Tooltip>
        );
      }

      if (server.status === McpscopeServerStatus.ACTIVE) {
        return (
          <DropdownMenu
            placement="bottomRight"
            items={[
              {
                danger: true,
                disabled: !canEdit,
                icon: <Icon icon={Unplug} />,
                key: 'disconnect',
                label: t('tools.mcpscope.disconnect', { defaultValue: 'Disconnect' }),
                onClick: handleDisconnect,
              },
            ]}
          >
            <Tooltip title={editReason}>
              <LobeButton disabled={!canEdit} icon={MoreHorizontalIcon} />
            </Tooltip>
          </DropdownMenu>
        );
      }

      return null;
    };

    const isConnected = server?.status === McpscopeServerStatus.ACTIVE;
    const isError = server?.status === McpscopeServerStatus.ERROR;

    const renderNavExtra = () => {
      if (isConnecting) {
        return <Button disabled icon={<Icon spin icon={Loader2} />} size="small" type="text" />;
      }
      if (isConnected) {
        return (
          <Tooltip title={t('tools.mcpscope.connected')}>
            <Center width={20}>
              <Icon icon={CircleCheck} size={16} style={{ color: cssVar.colorSuccess }} />
            </Center>
          </Tooltip>
        );
      }
      if (isError) {
        return (
          <Tooltip title={!canCreate ? createReason : editReason}>
            <Button
              disabled={!canCreate || !canEdit}
              icon={<Icon icon={SquareArrowOutUpRight} />}
              size="small"
              type="text"
              onClick={handleConnect}
            >
              {t('tools.mcpscope.reconnect', { defaultValue: 'Reconnect' })}
            </Button>
          </Tooltip>
        );
      }
      return (
        <Tooltip title={!canCreate ? createReason : editReason}>
          <Button
            disabled={!canCreate || !canEdit}
            icon={<Icon icon={SquareArrowOutUpRight} />}
            size="small"
            type="text"
            onClick={handleConnect}
          >
            {t('tools.mcpscope.connect', { defaultValue: 'Connect' })}
          </Button>
        </Tooltip>
      );
    };

    if (onSelect) {
      const renderNavIcon = () => {
        const { icon, label } = serverType;
        if (typeof icon === 'string') return <Avatar alt={label} avatar={icon} size={18} />;
        return <Icon fill={cssVar.colorText} icon={icon} size={18} />;
      };
      return (
        <NavItem
          active={isSelected}
          extra={renderNavExtra()}
          icon={renderNavIcon}
          title={serverType.label}
          titleColor={!isConnected ? cssVar.colorTextDescription : undefined}
          onClick={isConnected ? onSelect : undefined}
        />
      );
    }

    return (
      <Flexbox
        horizontal
        align="center"
        className={styles.container}
        gap={8}
        justify="space-between"
        style={{
          ...(isSelected ? { background: 'var(--ant-color-primary-bg)', borderRadius: 6 } : {}),
          ...(onSelect ? { cursor: 'pointer' } : {}),
        }}
        onClick={onSelect}
      >
        <Flexbox horizontal align="center" gap={8} style={{ flex: 1, overflow: 'hidden' }}>
          <Flexbox
            horizontal
            align="center"
            gap={8}
            style={{ cursor: onSelect ? undefined : 'pointer' }}
          >
            <div className={`${styles.icon} ${!isConnected ? styles.disconnectedIcon : ''}`}>
              {renderIcon()}
            </div>
            <span className={`${styles.title} ${!isConnected ? styles.disconnectedTitle : ''}`}>
              {serverType.label}
            </span>
          </Flexbox>
          {!isConnected && renderStatus()}
        </Flexbox>
        {!onSelect && (
          <Flexbox horizontal align="center" gap={8}>
            {isConnected && renderStatus()}
            {renderAction()}
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

McpscopeSkillItem.displayName = 'McpscopeSkillItem';

export { McpscopeConfigModal };
export default McpscopeSkillItem;
