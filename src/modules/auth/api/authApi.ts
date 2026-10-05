import { api } from '@/shared/lib/axios';
import type { Me } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
}

/** POST /auth/login/ response. */
export interface LoginResponse {
  access: string;
  refresh: string;
  user: Me;
}

// POST /auth/login/
export const login = async ({ username, password }: LoginPayload) => {
  const { data } = await api.post<LoginResponse>('/auth/login/', { username: username.trim(), password });
  return data;
};

// POST /auth/logout/  — blacklists the refresh token
export const logoutRequest = async (refresh: string) => {
  await api.post('/auth/logout/', { refresh });
};

// GET /auth/me/
export const fetchMe = async () => {
  const { data } = await api.get<Me>('/auth/me/');
  return data;
};

// POST /auth/password-reset/  — always succeeds for the UI: never reveal whether an email exists
export const forgotPassword = async (email: string) => {
  await api.post('/auth/password-reset/', { email });
};

// POST /auth/password-reset/confirm/  — `uid` and `token` come from the emailed link
export const resetPassword = async (body: { uid: string; token: string; new_password: string }) => {
  await api.post('/auth/password-reset/confirm/', body);
};
