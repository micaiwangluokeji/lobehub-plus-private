import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { getScopePermissions } from '@/utils/rbac';

import { CreditTransactionController } from '../controllers/credit-transaction.controller';
import { requireAuth } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/permission-check';
import {
  AdjustCreditsRequestSchema,
  CreditTransactionListRequestSchema,
} from '../types/credit-transaction.type';

const CreditTransactionsRoutes = new Hono();

/**
 * Get credit transaction list (supports filtering and pagination)
 * GET /api/v1/credit-transactions?page=&pageSize=&userId=&type=&createdAtAfter=&createdAtBefore=
 */
CreditTransactionsRoutes.get(
  '/',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('CREDIT_READ', ['ALL']),
    'You do not have permission to view credit transactions',
  ),
  zValidator('query', CreditTransactionListRequestSchema),
  async (c) => {
    const controller = new CreditTransactionController();
    return await controller.list(c);
  },
);

/**
 * Adjust user credits (admin adjustment)
 * POST /api/v1/credit-transactions/adjust
 */
CreditTransactionsRoutes.post(
  '/adjust',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('CREDIT_MANAGE', ['ALL']),
    'You do not have permission to adjust credits',
  ),
  zValidator('json', AdjustCreditsRequestSchema),
  async (c) => {
    const controller = new CreditTransactionController();
    return await controller.adjustCredits(c);
  },
);

export default CreditTransactionsRoutes;
