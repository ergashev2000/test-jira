import { api } from '@/shared/lib/axios';
import { toAppSettings, toBackendPatch, type BackendSettings } from '@/shared/lib/settingsShape';
import type { AppSettings } from '@/shared/types';

export type SettingsSection = Exclude<keyof AppSettings, 'workflow_settings'>;

// GET /settings/  — flat object on the backend, grouped into sections for the UI
export const getSettings = async () => {
  const { data } = await api.get<BackendSettings | AppSettings>('/settings/');
  return toAppSettings(data);
};

// PATCH /settings/  — SUPER_ADMIN only; sends the section's fields in the backend's flat shape
export const updateSettings = async <S extends SettingsSection>(section: S, values: AppSettings[S], current?: AppSettings) => {
  const { data } = await api.patch<BackendSettings | AppSettings>('/settings/', toBackendPatch(section, values, current));
  return toAppSettings(data);
};
