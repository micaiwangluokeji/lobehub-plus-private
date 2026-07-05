import { eq } from 'drizzle-orm';

import { creditConfigs, paymentConfigs, plans } from '../schemas/paymentPlans';
import type { LobeChatDatabase } from '../type';

export class PaymentPlansModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  // ── Payment Config ──────────────────────────────────

  getPaymentConfig = async () => {
    const [row] = await this.db.select().from(paymentConfigs).limit(1);
    return row || null;
  };

  updatePaymentConfig = async (data: Partial<typeof paymentConfigs.$inferInsert>) => {
    const existing = await this.getPaymentConfig();
    if (existing) {
      const [row] = await this.db
        .update(paymentConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(paymentConfigs.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(paymentConfigs).values(data as any).returning();
    return row;
  };

  // ── Plans CRUD ─────────────────────────────────────

  listPlans = async () => {
    return this.db.select().from(plans).orderBy(plans.sort);
  };

  getPlanById = async (id: string) => {
    const [row] = await this.db.select().from(plans).where(eq(plans.id, id)).limit(1);
    return row || null;
  };

  createPlan = async (data: typeof plans.$inferInsert) => {
    const [row] = await this.db.insert(plans).values(data).returning();
    return row;
  };

  updatePlan = async (id: string, data: Partial<typeof plans.$inferInsert>) => {
    const [row] = await this.db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return row;
  };

  deletePlan = async (id: string) => {
    await this.db.delete(plans).where(eq(plans.id, id));
  };

  // ── Credit Config ──────────────────────────────────

  getCreditConfig = async () => {
    const [row] = await this.db.select().from(creditConfigs).limit(1);
    return row || null;
  };

  updateCreditConfig = async (data: Partial<typeof creditConfigs.$inferInsert>) => {
    const existing = await this.getCreditConfig();
    if (existing) {
      const [row] = await this.db
        .update(creditConfigs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(creditConfigs.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(creditConfigs).values(data as any).returning();
    return row;
  };
}
