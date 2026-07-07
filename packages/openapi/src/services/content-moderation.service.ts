import { and, count, desc, eq } from 'drizzle-orm';

import { contentModerationLogs, type ContentModerationLogItem } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type {
  ContentModerationListRequest,
  ContentModerationListResponse,
  UpdateContentModerationRequest,
} from '../types/content-moderation.type';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Content moderation service — admin cross-user perspective.
 * Does not extend BaseService (no per-user scoping).
 */
export class ContentModerationService {
  private readonly db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  async list(
    request: ContentModerationListRequest,
  ): Promise<ContentModerationListResponse> {
    const conditions = [];

    if (request.userId) conditions.push(eq(contentModerationLogs.userId, request.userId));
    if (request.contentType)
      conditions.push(eq(contentModerationLogs.contentType, request.contentType));
    if (request.moderationResult)
      conditions.push(
        eq(contentModerationLogs.moderationResult, request.moderationResult),
      );
    if (request.status) conditions.push(eq(contentModerationLogs.status, request.status));

    const where = and(...conditions);
    const page = request.page ?? DEFAULT_PAGE;
    const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(contentModerationLogs)
        .where(where)
        .orderBy(desc(contentModerationLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(contentModerationLogs).where(where),
    ]);

    return {
      data,
      page,
      pageSize,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async update(
    id: string,
    request: UpdateContentModerationRequest,
  ): Promise<ContentModerationLogItem | null> {
    const [row] = await this.db
      .update(contentModerationLogs)
      .set({
        ...(request.status !== undefined && { status: request.status }),
        ...(request.moderationResult !== undefined && {
          moderationResult: request.moderationResult,
        }),
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentModerationLogs.id, id))
      .returning();

    return row ?? null;
  }
}
