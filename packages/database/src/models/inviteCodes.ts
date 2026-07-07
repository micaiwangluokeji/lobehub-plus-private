import { eq } from 'drizzle-orm';

import { inviteCodes, type NewInviteCodeItem } from '../schemas/inviteCodes';
import type { LobeChatDatabase } from '../type';

export class InviteCodesModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  findByCode = async (code: string) => {
    const [row] = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);
    return row || null;
  };

  findByUser = async (userId: string) => {
    return this.db.select().from(inviteCodes).where(eq(inviteCodes.userId, userId));
  };

  listReferrals = async (userId: string) => {
    return this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.userId, userId))
      .orderBy(inviteCodes.createdAt);
  };

  create = async (data: NewInviteCodeItem) => {
    const [row] = await this.db.insert(inviteCodes).values(data).returning();
    return row;
  };

  markUsed = async (code: string, usedByUserId: string) => {
    const [row] = await this.db
      .update(inviteCodes)
      .set({ status: 'used', usedByUserId, usedAt: new Date() })
      .where(eq(inviteCodes.code, code))
      .returning();
    return row;
  };

  countByUser = async (userId: string) => {
    const [row] = await this.db
      .select({ count: inviteCodes.usedByUserId })
      .from(inviteCodes)
      .where(eq(inviteCodes.userId, userId));
    return (row as any)?.count || 0;
  };
}
