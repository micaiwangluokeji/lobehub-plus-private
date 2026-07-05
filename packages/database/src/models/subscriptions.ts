import { and, eq, gte, lte, sql } from 'drizzle-orm';

import {
  subscriptions,
  type NewSubscriptionItem,
  type SubscriptionItem,
  type UpdateSubscriptionItem,
} from '../schemas/subscriptions';
import type { LobeChatDatabase } from '../type';

export class SubscriptionsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── CRUD ─────────────────────────────────────────

  list = async (params?: {
    userId?: string;
    workspaceId?: string;
    status?: string;
    planId?: string;
    currentPeriodEndAfter?: Date;
    currentPeriodEndBefore?: Date;
    page?: number;
    pageSize?: number;
  }) => {
    const conditions: any[] = [];

    if (params?.userId) conditions.push(eq(subscriptions.userId, params.userId));
    if (params?.workspaceId) conditions.push(eq(subscriptions.workspaceId, params.workspaceId));
    if (params?.status) conditions.push(eq(subscriptions.status, params.status));
    if (params?.planId) conditions.push(eq(subscriptions.planId, params.planId));
    if (params?.currentPeriodEndAfter)
      conditions.push(gte(subscriptions.currentPeriodEnd, params.currentPeriodEndAfter));
    if (params?.currentPeriodEndBefore)
      conditions.push(lte(subscriptions.currentPeriodEnd, params.currentPeriodEndBefore));

    const query = this.db.select().from(subscriptions).where(and(...conditions));
    // TODO: add orderBy and pagination
    return query;
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return row || null;
  };

  create = async (data: NewSubscriptionItem) => {
    const [row] = await this.db.insert(subscriptions).values(data).returning();
    return row;
  };

  update = async (id: string, data: UpdateSubscriptionItem) => {
    const [row] = await this.db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return row;
  };

  delete = async (id: string) => {
    await this.db.delete(subscriptions).where(eq(subscriptions.id, id));
  };

  // ── Business logic ───────────────────────────────

  /**
   * 获取用户的活跃订阅
   */
  getActiveSubscription = async (userId: string) => {
    const [row] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          // currentPeriodEnd > now
          sql`${subscriptions.currentPeriodEnd} > now()`,
        ),
      )
      .limit(1);
    return row || null;
  };

  /**
   * 取消订阅
   */
  cancelSubscription = async (id: string, reason?: string) => {
    const [row] = await this.db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        cancelReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return row;
  };

  /**
   * 续订订阅
   */
  renewSubscription = async (id: string, newPeriodEnd: Date) => {
    const [row] = await this.db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodEnd: newPeriodEnd,
        canceledAt: null,
        cancelReason: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return row;
  };

  /**
   * 获取即将过期的订阅（用于提醒）
   */
  getExpiringSubscriptions = async (daysBefore: number) => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysBefore);

    return this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.currentPeriodEnd, threshold),
          sql`${subscriptions.currentPeriodEnd} > now()`,
        ),
      );
  };

  // ── Statistics ────────────────────────────────────

  /**
   * 统计订阅数量
   */
  countSubscriptions = async (params?: { status?: string; planId?: string }) => {
    const conditions: any[] = [];

    if (params?.status) conditions.push(eq(subscriptions.status, params.status));
    if (params?.planId) conditions.push(eq(subscriptions.planId, params.planId));

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(...conditions));

    return result[0]?.count || 0;
  };
}
