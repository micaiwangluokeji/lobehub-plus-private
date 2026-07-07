import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { WorkspaceService } from '../services';
import type {
  UpdateWorkspaceRequest,
  WorkspaceListRequest,
} from '../types/workspace.type';

/**
 * Workspace controller for the admin view.
 * Handles workspace-related HTTP requests (cross-user, admin scope).
 */
export class WorkspaceController extends BaseController {
  private async getService(): Promise<WorkspaceService> {
    const db = await this.getDatabase();
    return new WorkspaceService(db);
  }

  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<WorkspaceListRequest>(c);
      const service = await this.getService();
      const result = await service.list(request);

      return this.success(c, result, 'Workspace list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const service = await this.getService();
      const result = await service.getById(id);

      return this.success(c, result, 'Workspace info retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const data = await this.getBody<UpdateWorkspaceRequest>(c);
      const service = await this.getService();
      const result = await service.update(id, data);

      return this.success(c, result, 'Workspace updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const service = await this.getService();
      const result = await service.delete(id);

      return this.success(c, result, 'Workspace deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async listMembers(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const service = await this.getService();
      const result = await service.listMembers(id);

      return this.success(c, result, 'Workspace members retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
