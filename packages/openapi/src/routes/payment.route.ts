import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { getScopePermissions } from '@/utils/rbac';

import { PaymentController } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/permission-check';
import {
  CreateRefundRequestSchema,
  PaymentConfigIdParamSchema,
  PaymentOrderIdParamSchema,
  PaymentOrderListRequestSchema,
  UpdatePaymentConfigRequestSchema,
} from '../types/payment.type';

const PaymentRoutes = new Hono();

/**
 * Get payment configs (global config rows)
 * GET /api/v1/payment/configs
 */
PaymentRoutes.get(
  '/configs',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('BILLING_READ', ['ALL']),
    'You do not have permission to view payment configs',
  ),
  async (c) => {
    const controller = new PaymentController();
    return await controller.listConfigs(c);
  },
);

/**
 * Update a payment config by ID
 * PATCH /api/v1/payment/configs/:id
 */
PaymentRoutes.patch(
  '/configs/:id',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('BILLING_MANAGE', ['ALL']),
    'You do not have permission to update payment configs',
  ),
  zValidator('param', PaymentConfigIdParamSchema),
  zValidator('json', UpdatePaymentConfigRequestSchema),
  async (c) => {
    const controller = new PaymentController();
    return await controller.updateConfig(c);
  },
);

/**
 * Get payment order list (supports filtering and pagination)
 * GET /api/v1/payment/orders?page=&pageSize=&userId=&status=
 */
PaymentRoutes.get(
  '/orders',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('BILLING_READ', ['ALL']),
    'You do not have permission to view payment orders',
  ),
  zValidator('query', PaymentOrderListRequestSchema),
  async (c) => {
    const controller = new PaymentController();
    return await controller.listOrders(c);
  },
);

/**
 * Get payment order details by ID
 * GET /api/v1/payment/orders/:id
 */
PaymentRoutes.get(
  '/orders/:id',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('BILLING_READ', ['ALL']),
    'You do not have permission to view payment order details',
  ),
  zValidator('param', PaymentOrderIdParamSchema),
  async (c) => {
    const controller = new PaymentController();
    return await controller.getOrderById(c);
  },
);

/**
 * Create a refund request for a payment order
 * POST /api/v1/payment/refunds
 */
PaymentRoutes.post(
  '/refunds',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('BILLING_MANAGE', ['ALL']),
    'You do not have permission to create refunds',
  ),
  zValidator('json', CreateRefundRequestSchema),
  async (c) => {
    const controller = new PaymentController();
    return await controller.createRefund(c);
  },
);

export default PaymentRoutes;
