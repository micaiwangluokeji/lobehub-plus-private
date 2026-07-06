import { and, count, desc, eq } from 'drizzle-orm';

import { SubscriptionsModel } from '@/database/models/subscriptions';
import {
  subscriptions,
  type SubscriptionItem,
  type UpdateSubscriptionItem,
} from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  CreateSubscriptionRequest,
  SubscriptionListRequest,
  SubscriptionListResponse,
  UpdateSubscriptionRequest,
} from '../types/subscription.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Subscription service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class SubscriptionService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: SubscriptionListRequest): Promise<SubscriptionListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(subscriptions.userId, request.userId));
    if (request.workspaceId) conditions.push(eq(subscriptions.workspaceId, request.workspaceId));
    if (request.status) conditions.push(eq(subscriptions.status, request.status));
    if (request.planId) conditions.push(eq(subscriptions.planId, request.planId));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(subscriptions)
        .where(where)
        .orderBy(desc(subscriptions.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(subscriptions).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: string): Promise<SubscriptionItem | null> {
    const model = new SubscriptionsModel(this.db);
    return model.getById(id);
  }

  async create(data: CreateSubscriptionRequest): Promise<SubscriptionItem | undefined> {
    const model = new SubscriptionsModel(this.db);
    return model.create({
      billingCycle: data.billingCycle ?? 'month',
      currentPeriodEnd: new Date(data.currentPeriodEnd),
      currentPeriodStart: new Date(data.currentPeriodStart),
      paymentProvider: data.paymentProvider ?? null,
      paymentSubscriptionId: data.paymentSubscriptionId ?? null,
      planId: data.planId ?? null,
      status: data.status ?? 'active',
      userId: data.userId,
      workspaceId: data.workspaceId ?? null,
    });
  }

  async update(
    id: string,
    data: UpdateSubscriptionRequest,
  ): Promise<SubscriptionItem | undefined> {
    const model = new SubscriptionsModel(this.db);
    const updateData: UpdateSubscriptionItem = {};

    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.workspaceId !== undefined) updateData.workspaceId = data.workspaceId ?? null;
    if (data.planId !== undefined) updateData.planId = data.planId ?? null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.billingCycle !== undefined) updateData.billingCycle = data.billingCycle;
    if (data.currentPeriodStart !== undefined)
      updateData.currentPeriodStart = new Date(data.currentPeriodStart);
    if (data.currentPeriodEnd !== undefined)
      updateData.currentPeriodEnd = new Date(data.currentPeriodEnd);
    if (data.paymentProvider !== undefined) updateData.paymentProvider = data.paymentProvider ?? null;
    if (data.paymentSubscriptionId !== undefined)
      updateData.paymentSubscriptionId = data.paymentSubscriptionId ?? null;

    return model.update(id, updateData);
  }

  async delete(id: string): Promise<{ id: string }> {
    const model = new SubscriptionsModel(this.db);
    await model.delete(id);
    return { id };
  }

  async cancelSubscription(
    id: string,
    reason?: string,
  ): Promise<SubscriptionItem | undefined> {
    const model = new SubscriptionsModel(this.db);
    return model.cancelSubscription(id, reason);
  }

  async renewSubscription(
    id: string,
    newPeriodEnd: string,
  ): Promise<SubscriptionItem | undefined> {
    const model = new SubscriptionsModel(this.db);
    return model.renewSubscription(id, new Date(newPeriodEnd));
  }
}
