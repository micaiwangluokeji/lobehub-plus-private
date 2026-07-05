'use client';

import { message } from 'antd';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

class AdminApiBase {
  protected baseUrl = '/api/v1';

  private getDefaultHeaders(): Record<string, string> {
    // 🔧 Dev mode: bypass OpenAPI auth by adding the debug header.
    // The server-side userAuthMiddleware skips auth when this header is
    // present and NODE_ENV === 'development'.
    if (__DEV__) {
      return { 'lobe-auth-dev-backend-api': '1' };
    }
    return {};
  }

  protected async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getDefaultHeaders(),
      ...(fetchOptions.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage =
        typeof errorBody.message === 'string'
          ? errorBody.message
          : typeof errorBody.error === 'string'
            ? errorBody.error
            : JSON.stringify(errorBody);
      message.error(errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  protected async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      body: body ? JSON.stringify(body) : undefined,
      method: 'POST',
    });
  }

  protected async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      body: body ? JSON.stringify(body) : undefined,
      method: 'PATCH',
    });
  }

  protected async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export type { RequestOptions };

export { AdminApiBase };
