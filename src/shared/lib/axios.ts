import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

import { MAX_PAGE_SIZE } from '@/shared/constants';
import { queryClient } from '@/shared/lib/react-query';
import { useSessionStore } from '@/shared/lib/session';

import { ApiError } from './apiError';
import { mockAwareAdapter } from './mockServer/adapter';
import { normalizeResponse } from './normalize';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// Arrays go as repeated keys (`status=todo&status=done`) — what django-filter expects.
// The adapter serves mock data in demo mode or when the backend is unreachable / lacks an endpoint.
export const api = axios.create({ baseURL: BASE_URL, timeout: 20_000, paramsSerializer: { indexes: null }, adapter: mockAwareAdapter });

const AUTH_ENDPOINTS = ['/auth/login/', '/auth/refresh/'];
const isAuthEndpoint = (url?: string) => !!url && AUTH_ENDPOINTS.some((e) => url.includes(e));

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const STATUS_FALLBACK: Record<number, string> = {
  400: 'Please check the entered data',
  401: 'Session expired. Please log in again.',
  403: "You don't have permission for this action",
  404: 'Not found',
  500: 'Server error. Please try again later.',
};

const extractMessage = (data: unknown): string | null => {
  if (typeof data === 'string') return data || null;
  if (Array.isArray(data)) return data.length ? extractMessage(data[0]) : null;
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  for (const key of ['error', 'detail', 'message', 'non_field_errors']) {
    if (key in obj) {
      const msg = extractMessage(obj[key]);
      if (msg) return msg;
    }
  }
  const [field, value] = Object.entries(obj).find(([k]) => !['status_code', 'code'].includes(k)) ?? [];
  const msg = field ? extractMessage(value) : null;
  return msg && field ? `${field}: ${msg}` : msg;
};

const toApiError = (error: unknown): unknown => {
  if (!axios.isAxiosError(error)) return error;
  if (!error.response) return new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  const { status, data } = error.response;
  const notImplemented = !!data && typeof data === 'object' && 'not_implemented' in data;
  return new ApiError(status, extractMessage(data) ?? STATUS_FALLBACK[status] ?? `Request failed (${status})`, notImplemented);
};

const forceLogout = () => {
  useSessionStore.getState().clear();
  queryClient.clear();
};


let refreshing: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  refreshing ??= (async () => {
    const { refreshToken, setTokens } = useSessionStore.getState();
    if (!refreshToken) throw new ApiError(401, STATUS_FALLBACK[401]);
    const { data } = await axios.post<{ access: string; refresh?: string }>(
      `${BASE_URL}/auth/refresh/`,
      { refresh: refreshToken },
      { timeout: 20_000 },
    );
    setTokens(data.access, data.refresh ?? null);
    return data.access;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
};

api.interceptors.request.use((config) => {
  // The backend caps page_size at MAX_PAGE_SIZE; asking for more silently returns fewer rows.
  const params = config.params as Record<string, unknown> | undefined;
  if (params && Number(params.page_size) > MAX_PAGE_SIZE) config.params = { ...params, page_size: MAX_PAGE_SIZE };
  const token = useSessionStore.getState().token;
  if (token && !isAuthEndpoint(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => {
    normalizeResponse(r.data);
    return r;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) return Promise.reject(toApiError(error));
    const original = error.config as RetriableConfig;
    const status = error.response?.status;

    if (status === 401 && !isAuthEndpoint(original.url) && !original._retry) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return api(original as AxiosRequestConfig);
      } catch {
        forceLogout();
        return Promise.reject(new ApiError(401, STATUS_FALLBACK[401]));
      }
    }

    if (status === 401 && !isAuthEndpoint(original.url)) forceLogout();
    return Promise.reject(toApiError(error));
  },
);
