import { and, asc, count, eq, ilike } from 'drizzle-orm';

import { dictConfigs } from '@/database/schemas/dictConfigs';
import type { LobeChatDatabase } from '@/database/type';

import type {
  CreateDictConfigRequest,
  DictConfigItem,
  DictConfigListRequest,
  DictConfigListResponse,
  UpdateDictConfigRequest,
} from '../types/dict-config.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Dict config service — admin-level CRUD over dict_configs table.
 * Does not extend BaseService (no per-user scoping).
 */
export class DictConfigService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: DictConfigListRequest): Promise<DictConfigListResponse> {
    const conditions = [];

    if (request.category) conditions.push(eq(dictConfigs.group, request.category));
    if (request.key) conditions.push(ilike(dictConfigs.key, `%${request.key}%`));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(dictConfigs)
        .where(where)
        .orderBy(asc(dictConfigs.group), asc(dictConfigs.sort))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(dictConfigs).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: string): Promise<DictConfigItem | null> {
    const conditions = [eq(dictConfigs.id, id)];
    const [row] = await this.db
      .select()
      .from(dictConfigs)
      .where(and(...conditions))
      .limit(1);
    return row || null;
  }

  async create(data: CreateDictConfigRequest): Promise<DictConfigItem> {
    const [row] = await this.db
      .insert(dictConfigs)
      .values({
        description: data.description ?? null,
        enabled: data.enabled ?? true,
        group: data.group ?? 'general',
        key: data.key,
        label: data.label,
        sort: data.sort ?? 0,
        type: data.type ?? 'string',
        value: data.value,
      })
      .returning();
    return row;
  }

  async update(id: string, data: UpdateDictConfigRequest): Promise<DictConfigItem> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };

    if (data.description !== undefined) updateFields.description = data.description;
    if (data.enabled !== undefined) updateFields.enabled = data.enabled;
    if (data.group !== undefined) updateFields.group = data.group;
    if (data.key !== undefined) updateFields.key = data.key;
    if (data.label !== undefined) updateFields.label = data.label;
    if (data.sort !== undefined) updateFields.sort = data.sort;
    if (data.type !== undefined) updateFields.type = data.type;
    if (data.value !== undefined) updateFields.value = data.value;

    const [row] = await this.db
      .update(dictConfigs)
      .set(updateFields)
      .where(eq(dictConfigs.id, id))
      .returning();
    return row;
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.db.delete(dictConfigs).where(eq(dictConfigs.id, id));
    return { id };
  }
}
