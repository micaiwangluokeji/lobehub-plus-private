import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { SubscriptionController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import {
  CancelSubscriptionRequestSchema,
  CreateSubscriptionRequestSchema,
  RenewSubscriptionRequestSchema,
  SubscriptionIdParamSchema,
  SubscriptionListRequestSchema,
  UpdateSubscriptionRequestSchema,
} from '../types/subscription.type';

const SubscriptionsRoutes = new Hono();

/**
 * Get subscription list (supports filtering and pagination)
 * GET /api/v1/subscriptions
 */
SubscriptionsRoutes.get(
  '/',
  requireAuth,
  zValidator('query', SubscriptionListRequestSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.list(c);
  },
);

/**
 * Get subscription details by ID
 * GET /api/v1/subscriptions/:id
 */
SubscriptionsRoutes.get(
  '/:id',
  requireAuth,
  zValidator('param', SubscriptionIdParamSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.getById(c);
  },
);

/**
 * Create a new subscription
 * POST /api/v1/subscriptions
 */
SubscriptionsRoutes.post(
  '/',
  requireAuth,
  zValidator('json', CreateSubscriptionRequestSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.create(c);
  },
);

/**
 * Update a subscription
 * PATCH /api/v1/subscriptions/:id
 */
SubscriptionsRoutes.patch(
  '/:id',
  requireAuth,
  zValidator('param', SubscriptionIdParamSchema),
  zValidator('json', UpdateSubscriptionRequestSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.update(c);
  },
);

/**
 * Delete a subscription
 * DELETE /api/v1/subscriptions/:id
 */
SubscriptionsRoutes.delete(
  '/:id',
  requireAuth,
  zValidator('param', SubscriptionIdParamSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.delete(c);
  },
);

/**
 * Cancel a subscription
 * POST /api/v1/subscriptions/:id/cancel
 */
SubscriptionsRoutes.post(
  '/:id/cancel',
  requireAuth,
  zValidator('param', SubscriptionIdParamSchema),
  zValidator('json', CancelSubscriptionRequestSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.cancelSubscription(c);
  },
);

/**
 * Renew a subscription
 * POST /api/v1/subscriptions/:id/renew
 */
SubscriptionsRoutes.post(
  '/:id/renew',
  requireAuth,
  zValidator('param', SubscriptionIdParamSchema),
  zValidator('json', RenewSubscriptionRequestSchema),
  async (c) => {
    const subscriptionController = new SubscriptionController();
    return await subscriptionController.renewSubscription(c);
  },
);

export default SubscriptionsRoutes;
