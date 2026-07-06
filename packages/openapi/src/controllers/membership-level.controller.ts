import type { Context } from 'hono';

import { BaseController } from '../common/base.controller';
import { MembershipLevelService } from '../services/membership-level.service';
import type {
  CreateMembershipLevelRequest,
  MembershipLevelListRequest,
  UpdateMembershipLevelRequest,
} from '../types/membership-level.type';

/**
 * Membership level controller class
 * Handles membership level related HTTP requests and responses
 */
export class MembershipLevelController extends BaseController {
  async list(c: Context): Promise<Response> {
    try {
      const request = this.getQuery<MembershipLevelListRequest>(c);

      const db = await this.getDatabase();
      const membershipLevelService = new MembershipLevelService(db);
      const result = await membershipLevelService.list(request);

      return this.success(c, result, 'Membership level list retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getById(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const membershipLevelService = new MembershipLevelService(db);
      const result = await membershipLevelService.getById(id);

      if (!result) {
        return this.error(c, 'Membership level not found', 404);
      }

      return this.success(c, result, 'Membership level retrieved successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async create(c: Context): Promise<Response> {
    try {
      const body = await this.getBody<CreateMembershipLevelRequest>(c);

      if (!body) {
        return this.error(c, 'Request body cannot be empty', 400);
      }

      const db = await this.getDatabase();
      const membershipLevelService = new MembershipLevelService(db);
      const result = await membershipLevelService.create(body);

      return this.success(c, result, 'Membership level created successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async update(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);
      const body = await this.getBody<UpdateMembershipLevelRequest>(c);

      if (!body) {
        return this.error(c, 'Request body cannot be empty', 400);
      }

      const db = await this.getDatabase();
      const membershipLevelService = new MembershipLevelService(db);
      const result = await membershipLevelService.update(id, body);

      return this.success(c, result, 'Membership level updated successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async delete(c: Context): Promise<Response> {
    try {
      const { id } = this.getParams<{ id: string }>(c);

      const db = await this.getDatabase();
      const membershipLevelService = new MembershipLevelService(db);
      const result = await membershipLevelService.delete(id);

      return this.success(c, result, 'Membership level deleted successfully');
    } catch (error) {
      return this.handleError(c, error);
    }
  }
}
