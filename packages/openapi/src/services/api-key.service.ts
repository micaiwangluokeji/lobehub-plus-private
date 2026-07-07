import { and, count, desc, eq } from 'drizzle-orm';

import { ApiKeyModel } from '@/database/models/apiKey';
import { apiKeys, type ApiKeyItem } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  ApiKeyListRequest,
  ApiKeyListResponse,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/api-key.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const maskApiKey = (item: ApiKeyItem): ApiKeyItem => {
  const { key, keyHash, ...rest } = item;
  return { ...rest, key: '********' } as ApiKeyItem;
};

/**
 * Api Key service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class ApiKeyService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(request: ApiKeyListRequest): Promise<ApiKeyListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(apiKeys.userId, request.userId));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(apiKeys)
        .where(where)
        .orderBy(desc(apiKeys.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(apiKeys).where(where),
    ]);

    return {
      data: rows.map(maskApiKey),
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async getById(id: string): Promise<ApiKeyItem | null> {
    const [row] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    return row ? maskApiKey(row) : null;
  }

  async create(request: CreateApiKeyRequest): Promise<ApiKeyItem> {
    const apiKeyModel = new ApiKeyModel(this.db, request.userId, request.workspaceId);

    const row = await apiKeyModel.create({
      enabled: request.enabled,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
      name: request.name,
    });

    return maskApiKey(row);
  }

  async update(id: string, request: UpdateApiKeyRequest): Promise<ApiKeyItem | null> {
    const [row] = await this.db
      .update(apiKeys)
      .set({
        ...(request.name !== undefined && { name: request.name }),
        ...(request.enabled !== undefined && { enabled: request.enabled }),
        ...(request.expiresAt !== undefined && {
          expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, id))
      .returning();

    return row ? maskApiKey(row) : null;
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
    return { id };
  }
}
