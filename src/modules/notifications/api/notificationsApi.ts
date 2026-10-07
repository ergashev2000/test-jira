import { api } from '@/shared/lib/axios';
import type { ApiPaginated, AppNotification, ListParams, NotificationSetting, NotificationType } from '@/shared/types';

export interface NotificationListParams extends ListParams {
  is_read?: boolean;
  type?: NotificationType;
}

/** Backend item: text is in `body` (UI: `message`), `entity_type` is a model label like `tasks.task`. */
type RawNotification = Omit<AppNotification, 'message' | 'entity_type'> & { body?: string; message?: string; entity_type: string };

const ENTITY_TYPES: AppNotification['entity_type'][] = ['task', 'sprint', 'project', 'report'];

const toEntityType = (raw: string): AppNotification['entity_type'] => {
  const model = raw.split('.').pop()?.toLowerCase() ?? '';
  return ENTITY_TYPES.find((t) => model.startsWith(t)) ?? 'report';
};

const toNotification = ({ body, message, entity_type, ...n }: RawNotification): AppNotification => ({
  ...n,
  message: message ?? body ?? '',
  entity_type: toEntityType(entity_type),
});

// GET /notifications/?is_read=&type=&page=&page_size=  — newest first
export const listNotifications = async (params: NotificationListParams = {}) => {
  const { data } = await api.get<ApiPaginated<RawNotification>>('/notifications/', { params: { ordering: '-created_at', ...params } });
  return { ...data, results: data.results.map(toNotification) };
};

// GET /notifications/unread-count/  → { unread } today, { count } later
export const getUnreadCount = async () => {
  const { data } = await api.get<{ count?: number; unread?: number }>('/notifications/unread-count/');
  return data.count ?? data.unread ?? 0;
};

// POST /notifications/:id/read/
export const markRead = async (id: number) => {
  await api.post(`/notifications/${id}/read/`);
};

// POST /notifications/read-all/
export const markAllRead = async () => {
  await api.post('/notifications/read-all/');
};

export interface NotificationSettings {
  telegram_linked: boolean;
  items: NotificationSetting[];
}

/** GET/PUT /notification-settings/ item. */
interface RawSetting {
  event_type: NotificationType;
  label: string;
  web_enabled: boolean;
  telegram_enabled: boolean;
}

const toSetting = (s: RawSetting): NotificationSetting => ({ event: s.event_type, label: s.label, web: s.web_enabled, telegram: s.telegram_enabled });

/** Telegram link state isn't part of the settings response — it comes from GET /telegram/account/. */
const telegramLinked = async () => {
  const { data } = await api.get<{ linked: boolean }>('/telegram/account/');
  return data.linked;
};

// GET /notification-settings/  → [{ event_type, label, web_enabled, telegram_enabled }]
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const [{ data }, linked] = await Promise.all([api.get<RawSetting[]>('/notification-settings/'), telegramLinked()]);
  return { telegram_linked: linked, items: data.map(toSetting) };
};

// PUT /notification-settings/  { items: [{ event_type, web_enabled, telegram_enabled }] }
export const saveNotificationSettings = async (items: NotificationSetting[]): Promise<NotificationSettings> => {
  const { data } = await api.put<RawSetting[]>('/notification-settings/', {
    items: items.map((s) => ({ event_type: s.event, web_enabled: s.web, telegram_enabled: s.telegram })),
  });
  return { telegram_linked: await telegramLinked(), items: data.map(toSetting) };
};

export type { AppNotification };
