import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import type { AppSettings } from '@/shared/types';

import { getSettings, updateSettings, type SettingsSection } from '../api/settingsApi';

export const useAppSettings = () => useQuery({ queryKey: QUERY_KEYS.settings, queryFn: getSettings, staleTime: 60_000, retry: false });

export const useUpdateSettings = <S extends SettingsSection>(section: S) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AppSettings[S]) => updateSettings(section, values, qc.getQueryData<AppSettings>(QUERY_KEYS.settings)),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.settings, data);
      qc.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
};
