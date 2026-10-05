// Notifications are NOT IN api.json yet — these are the endpoints the UI expects
// (see docs/BACKEND_REQUIREMENTS.md → notifications).
import { api } from '@/shared/lib/axios';
import type { ApiPaginated, AppNotification, ListParams, NotificationSetting, NotificationType } from '@/shared/types';

export interface NotificationListParams extends ListParams {
  is_read?: boolean;
  type?: NotificationType;
}

// GET /notifications/?is_read=&type=&page=&page_size=  — newest first
export const listNotifications = async (params: NotificationListParams = {}) => {
  const { data } = await api.get<ApiPaginated<AppNotification>>('/notifications/', { params: { ordering: '-created_at', ...params } });
  return data;
};

// GET /notifications/unread-count/  → { count }
export const getUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count/');
  return data.count;
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

// GET /notifications/settings/
export const getNotificationSettings = async () => {
  const { data } = await api.get<NotificationSettings>('/notifications/settings/');
  return data;
};

// PUT /notifications/settings/  { items }
export const saveNotificationSettings = async (items: NotificationSetting[]) => {
  const { data } = await api.put<NotificationSettings>('/notifications/settings/', { items });
  return data;
};

export type { AppNotification };
