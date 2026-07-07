import { asc, eq } from 'drizzle-orm';

import { membershipLevels } from '../schemas/membershipLevels';
import type { LobeChatDatabase } from '../type';
import type { NewMembershipLevelItem, UpdateMembershipLevelItem } from '../schemas/membershipLevels';

export class MembershipLevelsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  list = async () => {
    return this.db.select().from(membershipLevels).orderBy(asc(membershipLevels.sort));
  };

  listEnabled = async () => {
    return this.db
      .select()
      .from(membershipLevels)
      .where(eq(membershipLevels.enabled, true))
      .orderBy(asc(membershipLevels.sort));
  };

  getById = async (id: string) => {
    const [row] = await this.db.select().from(membershipLevels).where(eq(membershipLevels.id, id)).limit(1);
    return row || null;
  };

  getBySlug = async (slug: string) => {
    const [row] = await this.db.select().from(membershipLevels).where(eq(membershipLevels.slug, slug)).limit(1);
    return row || null;
  };

  getDefaultLevel = async () => {
    const [row] = await this.db
      .select()
      .from(membershipLevels)
      .where(eq(membershipLevels.enabled, true))
      .orderBy(asc(membershipLevels.level))
      .limit(1);
    return row || null;
  };

  create = async (data: NewMembershipLevelItem) => {
    const [row] = await this.db.insert(membershipLevels).values(data).returning();
    return row;
  };

  update = async (id: string, data: UpdateMembershipLevelItem) => {
    const [row] = await this.db
      .update(membershipLevels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(membershipLevels.id, id))
      .returning();
    return row;
  };

  delete = async (id: string) => {
    await this.db.delete(membershipLevels).where(eq(membershipLevels.id, id));
  };
}
