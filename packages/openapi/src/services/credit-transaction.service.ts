import { and, count, desc, eq, gte, lte } from 'drizzle-orm';

import { CreditTransactionsModel } from '@/database/models/creditTransactions';
import { creditTransactions, users } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  AdjustCreditsRequest,
  CreditTransactionListRequest,
  CreditTransactionListResponse,
} from '../types/credit-transaction.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Credit transaction service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class CreditTransactionService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: CreditTransactionListRequest): Promise<CreditTransactionListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(creditTransactions.userId, request.userId));
    if (request.type) conditions.push(eq(creditTransactions.type, request.type));
    if (request.createdAtAfter)
      conditions.push(gte(creditTransactions.createdAt, new Date(request.createdAtAfter)));
    if (request.createdAtBefore)
      conditions.push(lte(creditTransactions.createdAt, new Date(request.createdAtBefore)));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(creditTransactions)
        .where(where)
        .orderBy(desc(creditTransactions.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(creditTransactions).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: number): Promise<typeof creditTransactions.$inferSelect | null> {
    const [row] = await this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(data: Record<string, unknown>): Promise<typeof creditTransactions.$inferSelect> {
    const [row] = await this.db
      .insert(creditTransactions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning();

    return row;
  }

  async getUserBalance(userId: string): Promise<number> {
    const model = new CreditTransactionsModel(this.db);
    return model.getUserBalance(userId);
  }

  async adjustCredits(
    request: AdjustCreditsRequest,
    operatorId: string,
  ): Promise<{ transaction: Awaited<ReturnType<CreditTransactionsModel['create']>> }> {
    // Verify target user exists
    const targetUser = await this.db.query.users.findFirst({
      where: eq(users.id, request.userId),
    });

    if (!targetUser) {
      const error = new Error('用户不存在');
      error.name = 'NotFoundError';
      throw error;
    }

    const model = new CreditTransactionsModel(this.db);
    const balanceBefore = await model.getUserBalance(request.userId);
    const balanceAfter = balanceBefore + request.amount;

    const transaction = await model.create({
      amount: request.amount,
      balanceAfter,
      description: request.reason,
      operatorId,
      referenceType: 'admin_adjust',
      source: 'admin_adjust',
      type: 'adjustment',
      userId: request.userId,
    });

    return { transaction };
  }
}
