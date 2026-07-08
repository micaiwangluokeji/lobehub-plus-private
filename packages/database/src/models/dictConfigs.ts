import { asc, desc, eq, ilike, and, count, sql } from 'drizzle-orm';

import { dictConfigs } from '../schemas/dictConfigs';
import type { LobeChatDatabase } from '../type';
import type { NewDictConfigItem, UpdateDictConfigItem } from '../schemas/dictConfigs';

interface ListDictConfigsParams {
  keyword?: string;
  group?: string;
  page?: number;
  pageSize?: number;
}

export class DictConfigsModel {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  list = async (params: ListDictConfigsParams = {}) => {
    const { keyword, group, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (keyword) {
      conditions.push(
        sql`(${ilike(dictConfigs.key, `%${keyword}%`)} OR ${ilike(dictConfigs.label, `%${keyword}%`)} OR ${ilike(dictConfigs.description, `%${keyword}%`)})`,
      );
    }
    if (group) {
      conditions.push(eq(dictConfigs.group, group));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.db.select({ total: count() }).from(dictConfigs).where(where);

    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(dictConfigs)
      .where(where)
      .orderBy(asc(dictConfigs.group), asc(dictConfigs.sort), desc(dictConfigs.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total,
      page,
      pageSize,
    };
  };

  getByKey = async (key: string) => {
    const [row] = await this.db.select().from(dictConfigs).where(eq(dictConfigs.key, key)).limit(1);
    return row || null;
  };

  getByGroup = async (group: string) => {
    return this.db
      .select()
      .from(dictConfigs)
      .where(eq(dictConfigs.group, group))
      .orderBy(asc(dictConfigs.sort));
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
