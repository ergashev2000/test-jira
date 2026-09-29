import axios from 'axios';

import { useSessionStore } from '@/shared/lib/session';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/** Real HTTP client — used when VITE_USE_MOCK=false. */
export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', timeout: 20_000 });

http.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) useSessionStore.getState().clear();
    return Promise.reject(error);
  },
);
