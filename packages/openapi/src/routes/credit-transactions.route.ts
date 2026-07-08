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
 * Get credit transaction by id
 * GET /api/v1/credit-transactions/:id
 */
CreditTransactionsRoutes.get(
  '/:id',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('CREDIT_READ', ['ALL']),
    'You do not have permission to view credit transactions',
  ),
  async (c) => {
    const controller = new CreditTransactionController();
    return await controller.getById(c);
  },
);

/**
 * Create credit transaction
 * POST /api/v1/credit-transactions
 */
CreditTransactionsRoutes.post(
  '/',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('CREDIT_MANAGE', ['ALL']),
    'You do not have permission to create credit transactions',
  ),
  async (c) => {
    const controller = new CreditTransactionController();
    return await controller.create(c);
  },
);

/**
 * Get user credit balance
 * GET /api/v1/credit-transactions/balance
 */
CreditTransactionsRoutes.get(
  '/balance',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('CREDIT_READ', ['ALL']),
    'You do not have permission to view credit balance',
  ),
  async (c) => {
    const controller = new CreditTransactionController();
    return await controller.getUserBalance(c);
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
