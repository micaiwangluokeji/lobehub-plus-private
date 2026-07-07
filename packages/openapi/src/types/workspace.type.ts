import { z } from 'zod';

// ==================== Workspace Admin Response Types ====================

/**
 * Workspace info for the admin view (cross-user). Mirrors the frontend
 * `AdminWorkspaceInfo` interface in `src/services/admin/workspaces.ts`.
 * Date fields are serialized to ISO strings for transport.
 */
export interface AdminWorkspaceInfo {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar: string | null;
  primaryOwnerId: string;
  settings: Record<string, unknown> | null;
  frozen: boolean;
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workspace member info for the admin view. Mirrors the frontend
 * `AdminWorkspaceMember` interface.
 */
export interface AdminWorkspaceMember {
  workspaceId: string;
  userId: string;
  role: string;
  joinedAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

// ==================== Workspace List Request ====================

export interface WorkspaceListRequest {
  keyword?: string;
  page?: number;
  pageSize?: number;
  frozen?: boolean;
}

export const WorkspaceListRequestSchema = z.object({
  keyword: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return '';
      return val.trim();
    })
    .refine((val) => val.length <= 100, 'Search keyword cannot exceed 100 characters'),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .optional(),
  pageSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(500))
    .optional(),
  frozen: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

// ==================== Update Workspace Request ====================

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  slug?: string;
  frozen?: boolean;
  frozenReason?: string;
}

export const UpdateWorkspaceRequestSchema = z.object({
  name: z.string().min(1, 'Workspace name cannot be empty').max(255).nullish(),
  description: z.string().max(1000).nullish(),
  slug: z.string().min(1, 'Workspace slug cannot be empty').max(100).nullish(),
  frozen: z.boolean().nullish(),
  frozenReason: z.string().nullish(),
});

// ==================== Common Schemas ====================

export const WorkspaceIdParamSchema = z.object({
  id: z.string().min(1, 'Workspace ID cannot be empty'),
});
