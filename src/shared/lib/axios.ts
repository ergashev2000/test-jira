import axios from 'axios';

import { useSessionStore } from '@/shared/lib/session';

import { ApiError } from './mock/mockRequest';

/** `false` → modules that are already wired to the backend use `http`; the rest still run on the mock API. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/** Real HTTP client. Base URL comes from VITE_API_URL (e.g. http://host:8000/api/v1). */
export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', timeout: 20_000 });

http.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STATUS_FALLBACK: Record<number, string> = {
  400: 'Please check the entered data',
  401: 'Session expired. Please log in again.',
  403: "You don't have permission for this action",
  404: 'Not found',
  500: 'Server error. Please try again later.',
};

/**
 * Pulls a human-readable message out of the backend error envelope:
 * `{ error: { status_code, detail: "…" | { detail: "…" } | { field: ["…"] } } }`
 * (plain DRF `{ detail }` / field errors are handled too).
 */
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
  // Field errors: { username: ["This field is required."] } → "username: This field is required."
  const [field, value] = Object.entries(obj).find(([k]) => k !== 'status_code') ?? [];
  const msg = field ? extractMessage(value) : null;
  return msg && field ? `${field}: ${msg}` : msg;
};

http.interceptors.response.use(
  (r) => r,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    if (!error.response) {
      return Promise.reject(new ApiError(0, 'Cannot reach the server. Check your connection and try again.'));
    }
    const { status, data } = error.response;
    // 401 on login means wrong credentials, not an expired session — keep the user on the form.
    const isLogin = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isLogin) useSessionStore.getState().clear();
    return Promise.reject(new ApiError(status, extractMessage(data) ?? STATUS_FALLBACK[status] ?? `Request failed (${status})`));
  },
);
