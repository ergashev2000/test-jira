import { api } from '@/shared/lib/axios';
import type { AppSettings } from '@/shared/types';

export type SettingsSection = keyof AppSettings;

// GET /settings/  — NOT IN api.json; readable by every signed-in user (task rules, company name)
export const getSettings = async () => {
  const { data } = await api.get<AppSettings>('/settings/');
  return data;
};

// PATCH /settings/  { <section>: {...} }  — NOT IN api.json; returns the full settings object
export const updateSettings = async <S extends SettingsSection>(section: S, values: AppSettings[S]) => {
  const { data } = await api.patch<AppSettings>('/settings/', { [section]: values });
  return data;
};
