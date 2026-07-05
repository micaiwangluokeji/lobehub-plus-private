import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import {
  creditTransactions,
  type CreditTransactionItem,
  type NewCreditTransactionItem,
  type UpdateCreditTransactionItem,
} from '../schemas/creditTransactions';
import type { LobeChatDatabase } from '../type';

export class CreditTransactionsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── CRUD ─────────────────────────────────────────

  list = async (params?: {
    userId?: string;
    workspaceId?: string;
    type?: string;
    source?: string;
    createdAtAfter?: Date;
    createdAtBefore?: Date;
    page?: number;
    pageSize?: number;
  }) => {
    const conditions: any[] = [];

    if (params?.userId) conditions.push(eq(creditTransactions.userId, params.userId));
    if (params?.workspaceId) conditions.push(eq(creditTransactions.workspaceId, params.workspaceId));
    if (params?.type) conditions.push(eq(creditTransactions.type, params.type));
    if (params?.source) conditions.push(eq(creditTransactions.source, params.source));
    if (params?.createdAtAfter)
      conditions.push(gte(creditTransactions.createdAt, params.createdAtAfter));
    if (params?.createdAtBefore)
      conditions.push(lte(creditTransactions.createdAt, params.createdAtBefore));

    const query = this.db
      .select()
      .from(creditTransactions)
      .where(and(...conditions))
      .orderBy(desc(creditTransactions.createdAt));
    // TODO: add pagination
    return query;
  };

  getById = async (id: number) => {
    const [row] = await this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.id, id))
      .limit(1);
    return row || null;
  };

  create = async (data: NewCreditTransactionItem) => {
    const [row] = await this.db.insert(creditTransactions).values(data).returning();
    return row;
  };

  // ── Business logic ───────────────────────────────

  /**
   * 获取用户积分余额（通过交易记录计算）
   */
  getUserBalance = async (userId: string) => {
    const result = await this.db
      .select({ balance: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)` })
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId));

    return result[0]?.balance || 0;
  };

  /**
   * 获取用户的积分交易统计
   */
  getUserStats = async (userId: string, periodDays?: number) => {
    const conditions: any[] = [eq(creditTransactions.userId, userId)];

    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      conditions.push(gte(creditTransactions.createdAt, startDate));
    }

    const result = await this.db
      .select({
        totalTopUp: sql<number>`coalesce(sum(case when ${creditTransactions.type} = 'top_up' then ${creditTransactions.amount} else 0 end), 0)`,
        totalConsumption: sql<number>`coalesce(sum(case when ${creditTransactions.type} = 'consumption' then abs(${creditTransactions.amount}) else 0 end), 0)`,
        totalRefund: sql<number>`coalesce(sum(case when ${creditTransactions.type} = 'refund' then ${creditTransactions.amount} else 0 end), 0)`,
        totalBonus: sql<number>`coalesce(sum(case when ${creditTransactions.type} = 'bonus' then ${creditTransactions.amount} else 0 end), 0)`,
        totalAdjustment: sql<number>`coalesce(sum(case when ${creditTransactions.type} = 'adjustment' then ${creditTransactions.amount} else 0 end), 0)`,
      })
      .from(creditTransactions)
      .where(and(...conditions));

    return (
      result[0] || {
        totalTopUp: 0,
        totalConsumption: 0,
        totalRefund: 0,
        totalBonus: 0,
        totalAdjustment: 0,
      }
    );
  };

  // ── Statistics ────────────────────────────────────

  /**
   * 统计积分交易总额
   */
  sumAmount = async (params?: { type?: string; source?: string; startDate?: Date; endDate?: Date }) => {
    const conditions: any[] = [];

    if (params?.type) conditions.push(eq(creditTransactions.type, params.type));
    if (params?.source) conditions.push(eq(creditTransactions.source, params.source));
    if (params?.startDate) conditions.push(gte(creditTransactions.createdAt, params.startDate));
    if (params?.endDate) conditions.push(lte(creditTransactions.createdAt, params.endDate));

    const result = await this.db
      .select({ total: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)` })
      .from(creditTransactions)
      .where(and(...conditions));

    return result[0]?.total || 0;
  };
}
