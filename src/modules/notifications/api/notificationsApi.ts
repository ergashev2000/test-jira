import { actor, ApiError, db, mockRequest, NOTIFICATION_TYPES, paginate } from '@/shared/lib/mock';
import type { AppNotification, NotificationSetting, NotificationType } from '@/shared/types';

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

const mine = () => {
  const me = actor();
  return db.notifications.filter((n) => n.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// GET /api/notifications
export const listNotifications = (p: NotificationListParams = {}) =>
  mockRequest(() => {
    const items = mine().filter((n) => (!p.unreadOnly || !n.isRead) && (!p.type || n.type === p.type));
    return paginate(items, p.page ?? 1, p.pageSize ?? 20);
  }, 250);

// GET /api/notifications/latest
export const latestNotifications = () =>
  mockRequest(() => {
    const all = mine();
    return { items: all.slice(0, 10), unread: all.filter((n) => !n.isRead).length };
  }, 200);

// POST /api/notifications/:id/read
export const markRead = (id: string) =>
  mockRequest(() => {
    const me = actor();
    const n = db.notifications.find((x) => x.id === id && x.userId === me.id);
    if (!n) throw new ApiError(404, 'Notification not found');
    n.isRead = true;
    return n;
  }, 150);

// POST /api/notifications/read-all
export const markAllRead = () =>
  mockRequest(() => {
    const me = actor();
    db.notifications.filter((n) => n.userId === me.id).forEach((n) => (n.isRead = true));
    return { ok: true };
  }, 250);

// GET /api/notifications/settings
export const getNotificationSettings = () =>
  mockRequest(() => {
    const me = actor();
    return {
      telegramLinked: !!me.telegram,
      items: NOTIFICATION_TYPES.map<NotificationSetting>((event) =>
        db.notificationSettings.find((s) => s.userId === me.id && s.event === event) ?? { userId: me.id, event, telegram: !!me.telegram, web: true }),
    };
  }, 250);

// PUT /api/notifications/settings
export const saveNotificationSettings = (items: Pick<NotificationSetting, 'event' | 'telegram' | 'web'>[]) =>
  mockRequest(() => {
    const me = actor();
    db.notificationSettings = [
      ...db.notificationSettings.filter((s) => s.userId !== me.id),
      ...items.map((s) => ({ ...s, userId: me.id, telegram: me.telegram ? s.telegram : false })),
    ];
    return { ok: true };
  });

export type { AppNotification };
