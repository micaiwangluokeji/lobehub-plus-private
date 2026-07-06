import { asc, eq } from 'drizzle-orm';

import { dictConfigs } from '../schemas/dictConfigs';
import type { LobeChatDatabase } from '../type';
import type { NewDictConfigItem, UpdateDictConfigItem } from '../schemas/dictConfigs';

export class DictConfigsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  list = async () => {
    return this.db.select().from(dictConfigs).orderBy(asc(dictConfigs.group), asc(dictConfigs.sort));
  };

  getByKey = async (key: string) => {
    const [row] = await this.db.select().from(dictConfigs).where(eq(dictConfigs.key, key)).limit(1);
    return row || null;
  };

  getByGroup = async (group: string) => {
    return this.db.select().from(dictConfigs).where(eq(dictConfigs.group, group)).orderBy(asc(dictConfigs.sort));
  };

  create = async (data: NewDictConfigItem) => {
    const [row] = await this.db.insert(dictConfigs).values(data).returning();
    return row;
  };

  update = async (id: string, data: UpdateDictConfigItem) => {
    const [row] = await this.db
      .update(dictConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dictConfigs.id, id))
      .returning();
    return row;
  };

  delete = async (id: string) => {
    await this.db.delete(dictConfigs).where(eq(dictConfigs.id, id));
  };
}
