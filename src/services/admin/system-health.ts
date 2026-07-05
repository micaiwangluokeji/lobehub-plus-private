'use client';

import { AdminApiBase } from './base';

export interface SystemHealthCheckItem {
  id: string;
  serviceName: string;
  status: string;
  responseTime?: number;
  errorMessage?: string;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  [serviceName: string]: {
    status: string;
    lastCheck: string;
    responseTime?: number;
  };
}

export interface ServiceStats {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  avgResponseTime: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class AdminSystemHealthService extends AdminApiBase {
  async list(params: {
    serviceName?: string;
    status?: string;
    checkedAtAfter?: string;
    checkedAtBefore?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.get<PaginatedResponse<SystemHealthCheckItem>>('/system-health', {
      serviceName: params.serviceName,
      status: params.status,
      checkedAtAfter: params.checkedAtAfter,
      checkedAtBefore: params.checkedAtBefore,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  async getById(id: string) {
    return this.get<SystemHealthCheckItem>(`/system-health/${id}`);
  }

  async create(params: {
    serviceName: string;
    status: string;
    responseTime?: number;
    errorMessage?: string;
  }) {
    return this.post<SystemHealthCheckItem>('/system-health', params);
  }

  async getHealthStatus() {
    return this.get<HealthStatus>('/system-health/status');
  }

  async getServiceStats(serviceName: string, params?: { startDate?: string; endDate?: string }) {
    return this.get<ServiceStats>(`/system-health/stats/${serviceName}`, {
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
  }
}

export const adminSystemHealthService = new AdminSystemHealthService();
