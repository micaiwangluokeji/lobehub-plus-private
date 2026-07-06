import AgentGroupsRoutes from './agent-groups.route';
import AgentsRoutes from './agents.route';
import ApiKeysRoutes from './api-keys.route';
import AuditLogsRoutes from './audit-logs.route';
import ContentModerationRoutes from './content-moderation.route';
import CreditTransactionsRoutes from './credit-transactions.route';
import DictConfigsRoutes from './dict-configs.route';
import FileRoutes from './files.route';
import KnowledgeBasesRoutes from './knowledge-bases.route';
import MembershipLevelsRoutes from './membership-levels.route';
import MessageTranslationsRoutes from './message-translations.route';
import MessagesRoutes from './messages.route';
import ModelsRoutes from './models.route';
import PaymentRoutes from './payment.route';
import PermissionsRoutes from './permissions.route';
import PlansRoutes from './plans.route';
import ProvidersRoutes from './providers.route';
import ResponsesRoutes from './responses.route';
import RevenueRoutes from './revenue.route';
import RolesRoutes from './roles.route';
import SettingsRoutes from './settings.route';
import SpendRoutes from './spend.route';
import SubscriptionsRoutes from './subscriptions.route';
import SystemHealthRoutes from './system-health.route';
import TopicsRoutes from './topics.route';
import UsersRoutes from './users.route';
import WorkspacesRoutes from './workspaces.route';

export default {
  'agent-groups': AgentGroupsRoutes,
  'agents': AgentsRoutes,
  'api-keys': ApiKeysRoutes,
  'audit-logs': AuditLogsRoutes,
  'content-moderation': ContentModerationRoutes,
  'credit-transactions': CreditTransactionsRoutes,
  'dict-configs': DictConfigsRoutes,
  'files': FileRoutes,
  'knowledge-bases': KnowledgeBasesRoutes,
  'membership-levels': MembershipLevelsRoutes,
  'message-translations': MessageTranslationsRoutes,
  'messages': MessagesRoutes,
  'models': ModelsRoutes,
  'payment': PaymentRoutes,
  'permissions': PermissionsRoutes,
  'plans': PlansRoutes,
  'providers': ProvidersRoutes,
  'responses': ResponsesRoutes,
  'revenue': RevenueRoutes,
  'roles': RolesRoutes,
  'settings': SettingsRoutes,
  'spend': SpendRoutes,
  'subscriptions': SubscriptionsRoutes,
  'system-health': SystemHealthRoutes,
  'topics': TopicsRoutes,
  'users': UsersRoutes,
  'workspaces': WorkspacesRoutes,
};
