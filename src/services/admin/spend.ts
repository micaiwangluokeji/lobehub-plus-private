'use client';

import { AdminApiBase } from './base';

export interface SpendLogItem {
  id: number;
  userId: string;
  workspaceId?: string;
  sessionId?: string;
  modelId?: string;
  modelName?: string;
  providerId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  creditsConsumed: number;
  pricePerCredit?: number;
  durationMs?: number;
  status: 'success' | 'failed' | 'timeout';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpendLogParams {
  userId: string;
  workspaceId?: string;
  sessionId?: string;
  modelId?: string;
  modelName?: string;
  providerId?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputCost?: number;
  outputCost?: number;
  totalCost?: number;
  creditsConsumed?: number;
  pricePerCredit?: number;
  durationMs?: number;
  status?: 'success' | 'failed' | 'timeout';
  errorMessage?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DailyCostTrendItem {
  date: string;
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

export interface ModelCostItem {
  modelId: string;
  modelName: string;
  totalCost: number;
  totalTokens: number;
  callCount: number;
}

class AdminSpendService extends AdminApiBase {
  async list(params: {
    userId?: string;
    workspaceId?: string;
    sessionId?: string;
    modelId?: string;
    providerId?: string;
    status?: string;
    createdAtAfter?: string;
    createdAtBefore?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<SpendLogItem>>('/spend', {
      userId: params.userId,
      workspaceId: params.workspaceId,
      sessionId: params.sessionId,
      modelId: params.modelId,
      providerId: params.providerId,
      status: params.status,
      createdAtAfter: params.createdAtAfter,
      createdAtBefore: params.createdAtBefore,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: number) {
    return this.get<SpendLogItem>(`/spend/${id}`);
  }

  async getDailyCostTrend(days: number = 30) {
    return this.get<DailyCostTrendItem[]>('/spend/daily-trend', { days });
  }

  async getModelCost(params?: { startDate?: string; endDate?: string }) {
    return this.get<ModelCostItem[]>('/spend/model-cost', {
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
  }

  async getTopSpenders(params: { limit?: number; startDate?: string; endDate?: string }) {
    return this.get<any[]>('/spend/top-spenders', {
      limit: params.limit,
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
  }
}

export const adminSpendService = new AdminSpendService();
