import { desc, eq } from 'drizzle-orm';

import { refundRequests } from '../schemas/refundRequests';
import type { LobeChatDatabase } from '../type';
import type { NewRefundRequestItem } from '../schemas/refundRequests';

export class RefundRequestsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  create = async (data: NewRefundRequestItem) => {
    const [row] = await this.db.insert(refundRequests).values(data).returning();
    return row;
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(refundRequests).where(eq(refundRequests.id, id)).limit(1);
    return row || null;
  };

  list = async () => {
    return this.db.select().from(refundRequests).orderBy(desc(refundRequests.createdAt));
  };

  listByUser = async (userId: string) => {
    return this.db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.userId, userId))
      .orderBy(desc(refundRequests.createdAt));
  };

  updateStatus = async (
    id: string,
    status: string,
    reviewerId?: string,
    reviewNote?: string,
    wxRefundId?: string,
  ) => {
    const [row] = await this.db
      .update(refundRequests)
      .set({
        status,
        reviewerId,
        reviewNote,
        wxRefundId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(refundRequests.id, id))
      .returning();
    return row;
  };
}
