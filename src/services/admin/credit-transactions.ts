'use client';

import { AdminApiBase } from './base';

export interface CreditTransactionItem {
  id: number;
  userId: string;
  workspaceId?: string;
  type: 'top_up' | 'consumption' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balanceAfter: number;
  source?: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  operatorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditTransactionParams {
  userId: string;
  workspaceId?: string;
  type: 'top_up' | 'consumption' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balanceAfter: number;
  source?: string;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  operatorId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminCreditTransactionService extends AdminApiBase {
  async list(params: {
    userId?: string;
    workspaceId?: string;
    type?: string;
    source?: string;
    createdAtAfter?: string;
    createdAtBefore?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<CreditTransactionItem>>('/credit-transactions', {
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: params.type,
      source: params.source,
      createdAtAfter: params.createdAtAfter,
      createdAtBefore: params.createdAtBefore,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: number) {
    return this.get<CreditTransactionItem>(`/credit-transactions/${id}`);
  }

  async create(params: CreateCreditTransactionParams) {
    return this.post<CreditTransactionItem>('/credit-transactions', params);
  }

  async getUserBalance(userId: string) {
    return this.get<{ balance: number }>(`/credit-transactions/balance`, { userId });
  }

  async adjustCredits(params: { userId: string; amount: number; reason: string }) {
    return this.post<CreditTransactionItem>('/credit-transactions/adjust', params);
  }
}

export const adminCreditTransactionService = new AdminCreditTransactionService();
