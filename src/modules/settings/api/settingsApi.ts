import { ApiError } from '@/shared/lib/apiError';
import { api } from '@/shared/lib/axios';
import type { AppSettings } from '@/shared/types';

export type SettingsSection = keyof AppSettings;

// GET /settings/  — NOT IN api.json; readable by every signed-in user (task rules, company name)
export const getSettings = async () => {
  const { data } = await api.get<AppSettings>('/settings/');
  // Until the backend ships this endpoint the response may be anything (404 page, other shape).
  const valid = !!data && typeof data === 'object' && (['general', 'telegram', 'tasks', 'sprint'] as const).every((k) => data[k] && typeof data[k] === 'object');
  if (!valid) throw new ApiError(501, 'Settings endpoint is not implemented on the backend yet (GET /settings/)');
  return data;
};

// PATCH /settings/  { <section>: {...} }  — NOT IN api.json; returns the full settings object
export const updateSettings = async <S extends SettingsSection>(section: S, values: AppSettings[S]) => {
  const { data } = await api.patch<AppSettings>('/settings/', { [section]: values });
  return data;
};
