import { and, desc, eq, ilike, isNull, ne, or } from 'drizzle-orm';

import { workspaces, workspaceMembers } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';

import type { ServiceResult } from '../types';
import type {
  AdminWorkspaceInfo,
  AdminWorkspaceMember,
  UpdateWorkspaceRequest,
  WorkspaceListRequest,
} from '../types/workspace.type';

/**
 * Workspace service for the admin view.
 *
 * Intentionally does NOT extend `BaseService`: the admin view is cross-user
 * (no `userId`/`workspaceId` scoping), so the workspace-where / permission
 * helpers from `BaseService` would be misleading. The constructor only takes
 * a `db` connection.
 */
export class WorkspaceService {
  protected db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  protected createBusinessError(message: string): Error {
    const error = new Error(message);
    error.name = 'BusinessError';
    return error;
  }

  protected createNotFoundError(message: string): Error {
    const error = new Error(message);
    error.name = 'NotFoundError';
    return error;
  }

  protected handleServiceError(error: unknown, operation: string): never {
    if (
      error instanceof Error &&
      [
        'BusinessError',
        'AuthenticationError',
        'AuthorizationError',
        'NotFoundError',
        'ValidationError',
      ].includes(error.name)
    ) {
      throw error;
    }

    const errorMessage = `${operation} failed: ${error instanceof Error ? error.message : 'unknown error'}`;
    throw this.createBusinessError(errorMessage);
  }

  private toAdminWorkspaceInfo(ws: typeof workspaces.$inferSelect): AdminWorkspaceInfo {
    return {
      id: ws.id,
      slug: ws.slug,
      name: ws.name,
      description: ws.description,
      avatar: ws.avatar,
      primaryOwnerId: ws.primaryOwnerId,
      settings: (ws.settings as Record<string, unknown> | null) ?? null,
      frozen: ws.frozen ?? false,
      frozenReason: ws.frozenReason,
      frozenAt: ws.frozenAt ? ws.frozenAt.toISOString() : null,
      createdAt: ws.createdAt.toISOString(),
      updatedAt: ws.updatedAt.toISOString(),
    };
  }

  /**
   * List all workspaces (cross-user, admin view). Supports keyword search on
   * name/slug and a frozen filter. Returns an array directly — the frontend
   * admin page expects a flat array, not a pagination envelope.
   */
  async list(request: WorkspaceListRequest): ServiceResult<AdminWorkspaceInfo[]> {
    try {
      const conditions = [];

      if (request.keyword) {
        conditions.push(
          or(
            ilike(workspaces.name, `%${request.keyword}%`),
            ilike(workspaces.slug, `%${request.keyword}%`),
          ),
        );
      }

      if (request.frozen !== undefined) {
        conditions.push(eq(workspaces.frozen, request.frozen));
      }

      const result = await this.db.query.workspaces.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(workspaces.createdAt),
      });

      return result.map((ws) => this.toAdminWorkspaceInfo(ws));
    } catch (error) {
      return this.handleServiceError(error, '获取工作空间列表');
    }
  }

  async getById(id: string): ServiceResult<AdminWorkspaceInfo> {
    try {
      const ws = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, id),
      });

      if (!ws) {
        throw this.createNotFoundError('工作空间不存在');
      }

      return this.toAdminWorkspaceInfo(ws);
    } catch (error) {
      return this.handleServiceError(error, '获取工作空间信息');
    }
  }

  async update(id: string, data: UpdateWorkspaceRequest): ServiceResult<AdminWorkspaceInfo> {
    try {
      const existing = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, id),
      });

      if (!existing) {
        throw this.createNotFoundError('工作空间不存在');
      }

      // Validate slug uniqueness when slug is being changed
      if (data.slug && data.slug !== existing.slug) {
        const existingBySlug = await this.db.query.workspaces.findFirst({
          where: and(eq(workspaces.slug, data.slug), ne(workspaces.id, id)),
        });

        if (existingBySlug) {
          throw this.createBusinessError('slug 已被其他工作空间使用');
        }
      }

      const { frozen, frozenReason, ...rest } = data;
      const updateData: Record<string, any> = { ...rest, updatedAt: new Date() };

      // Toggling freeze state also stamps frozenAt and clears frozenReason on unfreeze
      if (frozen !== undefined) {
        updateData.frozen = frozen;
        updateData.frozenAt = frozen ? new Date() : null;

        if (frozen) {
          if (frozenReason !== undefined) updateData.frozenReason = frozenReason;
        } else {
          updateData.frozenReason = null;
        }
      } else if (frozenReason !== undefined) {
        updateData.frozenReason = frozenReason;
      }

      await this.db.update(workspaces).set(updateData).where(eq(workspaces.id, id));

      const updated = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, id),
      });

      return this.toAdminWorkspaceInfo(updated!);
    } catch (error) {
      return this.handleServiceError(error, '更新工作空间信息');
    }
  }

  async delete(id: string): ServiceResult<{ id: string }> {
    try {
      const existing = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, id),
      });

      if (!existing) {
        throw this.createNotFoundError('工作空间不存在');
      }

      // Schema-level `onDelete: cascade` on workspace_members / invitations /
      // audit_logs handles related rows; a single delete is enough.
      await this.db.delete(workspaces).where(eq(workspaces.id, id));

      return { id };
    } catch (error) {
      return this.handleServiceError(error, '删除工作空间');
    }
  }

  async listMembers(id: string): ServiceResult<AdminWorkspaceMember[]> {
    try {
      const existing = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, id),
      });

      if (!existing) {
        throw this.createNotFoundError('工作空间不存在');
      }

      const members = await this.db.query.workspaceMembers.findMany({
        where: and(eq(workspaceMembers.workspaceId, id), isNull(workspaceMembers.deletedAt)),
      });

      return members.map((m) => ({
        workspaceId: m.workspaceId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
        deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
      }));
    } catch (error) {
      return this.handleServiceError(error, '获取工作空间成员');
    }
  }
}
