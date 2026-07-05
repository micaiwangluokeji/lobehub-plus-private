import { desc, eq } from 'drizzle-orm';

import { paymentOrders } from '../schemas/paymentOrders';
import type { LobeChatDatabase } from '../type';
import type { NewPaymentOrderItem, UpdatePaymentOrderItem } from '../schemas/paymentOrders';

export class PaymentOrdersModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  create = async (data: NewPaymentOrderItem) => {
    const [row] = await this.db.insert(paymentOrders).values(data).returning();
    return row;
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(paymentOrders).where(eq(paymentOrders.id, id)).limit(1);
    return row || null;
  };

  getByPrepayId = async (prepayId: string) => {
    const [row] = await this.db.select().from(paymentOrders).where(eq(paymentOrders.prepayId, prepayId)).limit(1);
    return row || null;
  };

  list = async () => {
    return this.db.select().from(paymentOrders).orderBy(desc(paymentOrders.createdAt));
  };

  listByUser = async (userId: string) => {
    return this.db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.userId, userId))
      .orderBy(desc(paymentOrders.createdAt));
  };

  update = async (id: string, data: UpdatePaymentOrderItem) => {
    const [row] = await this.db
      .update(paymentOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentOrders.id, id))
      .returning();
    return row;
  };

  markAsPaid = async (id: string, transactionId: string, paidAt: Date) => {
    const [row] = await this.db
      .update(paymentOrders)
      .set({ status: 'paid', transactionId, paidAt, updatedAt: new Date() })
      .where(eq(paymentOrders.id, id))
      .returning();
    return row;
  };
}
