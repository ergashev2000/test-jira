import { api } from '@/shared/lib/axios';
import type { Me, TelegramAccount, TelegramLinkToken } from '@/shared/types';

// PATCH /auth/me/  { full_name, phone }  — NOT IN api.json (self-service profile edit)
export const updateProfile = async (body: Pick<Me, 'full_name' | 'phone'>) => {
  const { data } = await api.patch<Me>('/auth/me/', body);
  return data;
};

// POST /auth/password-change/  { old_password, new_password }  — NOT IN api.json
export const changePassword = async (body: { old_password: string; new_password: string }) => {
  await api.post('/auth/password-change/', body);
};

// GET /telegram/account/
export const getTelegramAccount = async () => {
  const { data } = await api.get<TelegramAccount>('/telegram/account/');
  return data;
};

// POST /telegram/link-token/  — one-time code + https://t.me/<bot>?start=CODE
export const createTelegramLinkToken = async () => {
  const { data } = await api.post<TelegramLinkToken>('/telegram/link-token/');
  return data;
};

// DELETE /telegram/account/
export const disconnectTelegram = async () => {
  await api.delete('/telegram/account/');
};
