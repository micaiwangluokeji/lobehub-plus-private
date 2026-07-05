'use client';

import { AdminApiBase } from './base';

export interface SubscriptionItem {
  id: string;
  userId: string;
  workspaceId?: string;
  planId: string;
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  billingCycle: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
  cancelReason?: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionParams {
  userId: string;
  workspaceId?: string;
  planId: string;
  status?: 'active' | 'canceled' | 'expired' | 'past_due';
  billingCycle?: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
}

export interface UpdateSubscriptionParams {
  status?: 'active' | 'canceled' | 'expired' | 'past_due';
  billingCycle?: 'month' | 'year';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  cancelReason?: string;
  paymentProvider?: string;
  paymentSubscriptionId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminSubscriptionService extends AdminApiBase {
  async list(params: {
    userId?: string;
    workspaceId?: string;
    status?: string;
    planId?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<SubscriptionItem>>('/subscriptions', {
      userId: params.userId,
      workspaceId: params.workspaceId,
      status: params.status,
      planId: params.planId,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<SubscriptionItem>(`/subscriptions/${id}`);
  }

  async create(params: CreateSubscriptionParams) {
    return this.post<SubscriptionItem>('/subscriptions', params);
  }

  async update(id: string, params: UpdateSubscriptionParams) {
    return this.patch<SubscriptionItem>(`/subscriptions/${id}`, params);
  }

  async deleteSubscription(id: string) {
    return this.delete<{ success: boolean }>(`/subscriptions/${id}`);
  }

  async cancelSubscription(id: string, reason?: string) {
    return this.post<SubscriptionItem>(`/subscriptions/${id}/cancel`, { reason });
  }

  async renewSubscription(id: string, newPeriodEnd: string) {
    return this.post<SubscriptionItem>(`/subscriptions/${id}/renew`, { newPeriodEnd });
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
