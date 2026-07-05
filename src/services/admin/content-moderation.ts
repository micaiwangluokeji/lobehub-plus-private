'use client';

import { AdminApiBase } from './base';

export interface ContentModerationLogItem {
  id: string;
  userId?: string;
  contentType: string;
  contentId?: string;
  moderationResult: string;
  riskScore?: string;
  flaggedTags?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentModerationLogParams {
  userId?: string;
  contentType: string;
  contentId?: string;
  moderationResult: string;
  riskScore?: string;
  flaggedTags?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  status?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminContentModerationService extends AdminApiBase {
  async list(params: {
    userId?: string;
    contentType?: string;
    moderationResult?: string;
    status?: string;
    createdAtAfter?: string;
    createdAtBefore?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<ContentModerationLogItem>>('/content-moderation', {
      userId: params.userId,
      contentType: params.contentType,
      moderationResult: params.moderationResult,
      status: params.status,
      createdAtAfter: params.createdAtAfter,
      createdAtBefore: params.createdAtBefore,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<ContentModerationLogItem>(`/content-moderation/${id}`);
  }

  async create(params: CreateContentModerationLogParams) {
    return this.post<ContentModerationLogItem>('/content-moderation', params);
  }

  async updateStatus(id: string, status: string, reviewedBy?: string) {
    return this.post<ContentModerationLogItem>(`/content-moderation/${id}/status`, { status, reviewedBy });
  }

  async getModerationStats(params?: { startDate?: string; endDate?: string }) {
    return this.get<any>('/content-moderation/stats', {
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
  }
}

export const adminContentModerationService = new AdminContentModerationService();
