import type { AppSettings, Priority } from '@/shared/types';

/** GET/PATCH /settings/ as the backend has it today: one flat object (api.json → SystemSetting). */
export interface BackendSettings {
  company_name: string;
  timezone: string;
  /** 1 = Monday … 7 = Sunday */
  working_days: number[];
  work_start_time: string;
  work_end_time: string;
  morning_notification_time: string;
  reminders_time: string;
  evening_report_time: string;
  default_priority: Priority;
  default_sprint_duration_days: number;
  workflow_settings: Record<string, unknown> | null;
  updated_at?: string;
}

/** Attachment rules are fixed on the backend (not part of /settings/): 10 MB, these extensions. */
export const ATTACHMENT_RULES = {
  max_attachment_mb: 10,
  allowed_file_types: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'log', 'zip'],
};

const hm = (t: string | undefined, fallback: string) => (t ? t.slice(0, 5) : fallback);

const isSectioned = (s: BackendSettings | AppSettings): s is AppSettings => 'general' in s && typeof s.general === 'object';

/** Flat backend object → the sectioned shape the settings UI works with (sectioned input passes through). */
export const toAppSettings = (s: BackendSettings | AppSettings): AppSettings => {
  if (isSectioned(s)) return s;
  const workflow = s.workflow_settings ?? {};
  return {
    general: {
      company_name: s.company_name,
      timezone: s.timezone,
      working_days: Array.isArray(s.working_days) ? s.working_days : [1, 2, 3, 4, 5],
      work_start: hm(s.work_start_time, '09:00'),
      work_end: hm(s.work_end_time, '18:00'),
    },
    telegram: {
      bot_username: '',
      enabled: true,
      morning_time: hm(s.morning_notification_time, '09:00'),
      reminders_time: hm(s.reminders_time, '13:00'),
      evening_time: hm(s.evening_report_time, '18:00'),
    },
    tasks: { default_priority: s.default_priority, require_review: workflow.require_review === true, ...ATTACHMENT_RULES },
    sprint: { default_duration_days: s.default_sprint_duration_days },
    workflow_settings: workflow,
  };
};

/** One settings section → the flat PATCH body. Fields the backend doesn't store are dropped. */
export const toBackendPatch = <S extends keyof AppSettings>(section: S, values: AppSettings[S], current?: AppSettings): Partial<BackendSettings> => {
  switch (section) {
    case 'general': {
      const v = values as AppSettings['general'];
      return { company_name: v.company_name, timezone: v.timezone, working_days: v.working_days, work_start_time: v.work_start, work_end_time: v.work_end };
    }
    case 'telegram': {
      const v = values as AppSettings['telegram'];
      return { morning_notification_time: v.morning_time, reminders_time: v.reminders_time, evening_report_time: v.evening_time };
    }
    case 'tasks': {
      const v = values as AppSettings['tasks'];
      return { default_priority: v.default_priority, workflow_settings: { ...current?.workflow_settings, require_review: v.require_review } };
    }
    case 'sprint':
      return { default_sprint_duration_days: (values as AppSettings['sprint']).default_duration_days };
    default:
      return {};
  }
};
