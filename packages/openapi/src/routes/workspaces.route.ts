import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { getAllScopePermissions, getScopePermissions } from '@/utils/rbac';

import { WorkspaceController } from '../controllers';
import { requireAuth } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/permission-check';
import {
  UpdateWorkspaceRequestSchema,
  WorkspaceIdParamSchema,
  WorkspaceListRequestSchema,
} from '../types/workspace.type';

const WorkspaceRoutes = new Hono();

/**
 * List all workspaces (admin, cross-user view)
 * GET /api/v1/workspaces?keyword=xxx&frozen=true
 */
WorkspaceRoutes.get(
  '/',
  requireAuth,
  requireAnyPermission(
    getScopePermissions('WORKSPACE_READ', ['ALL']),
    'You do not have permission to view workspace list',
  ),
  zValidator('query', WorkspaceListRequestSchema),
  async (c) => {
    const workspaceController = new WorkspaceController();
    return await workspaceController.list(c);
  },
);

/**
 * Get workspace details by ID
 * GET /api/v1/workspaces/:id
 */
WorkspaceRoutes.get(
  '/:id',
  requireAuth,
  requireAnyPermission(
    getAllScopePermissions('WORKSPACE_READ'),
    'You do not have permission to view workspace details',
  ),
  zValidator('param', WorkspaceIdParamSchema),
  async (c) => {
    const workspaceController = new WorkspaceController();
    return await workspaceController.getById(c);
  },
);

/**
 * Update workspace (incl. freeze / unfreeze)
 * PATCH /api/v1/workspaces/:id
 */
WorkspaceRoutes.patch(
  '/:id',
  requireAuth,
  requireAnyPermission(
    getAllScopePermissions('WORKSPACE_UPDATE'),
    'You do not have permission to update workspace information',
  ),
  zValidator('param', WorkspaceIdParamSchema),
  zValidator('json', UpdateWorkspaceRequestSchema),
  async (c) => {
    const workspaceController = new WorkspaceController();
    return await workspaceController.update(c);
  },
);

/**
 * Delete a workspace
 * DELETE /api/v1/workspaces/:id
 */
WorkspaceRoutes.delete(
  '/:id',
  requireAuth,
  requireAnyPermission(
    getAllScopePermissions('WORKSPACE_DELETE'),
    'You do not have permission to delete a workspace',
  ),
  zValidator('param', WorkspaceIdParamSchema),
  async (c) => {
    const workspaceController = new WorkspaceController();
    return await workspaceController.delete(c);
  },
);

/**
 * List members of a workspace
 * GET /api/v1/workspaces/:id/members
 */
WorkspaceRoutes.get(
  '/:id/members',
  requireAuth,
  requireAnyPermission(
    getAllScopePermissions('WORKSPACE_MEMBER_READ'),
    'You do not have permission to view workspace members',
  ),
  zValidator('param', WorkspaceIdParamSchema),
  async (c) => {
    const workspaceController = new WorkspaceController();
    return await workspaceController.listMembers(c);
  },
);

export default WorkspaceRoutes;
