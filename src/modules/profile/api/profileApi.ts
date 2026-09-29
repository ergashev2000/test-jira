import dayjs from '@/shared/lib/dayjs';
import { actor, ApiError, audit, db, mockRequest, nowIso } from '@/shared/lib/mock';
import { PHONE_RE } from '@/shared/utils';

const CODE_TTL_MIN = 10;
/** Mock: bot "receives" /start CODE this many ms after the code is generated. */
const SIMULATED_LINK_DELAY = 8_000;

// PATCH /api/profile
export const updateProfile = (v: { fullName: string; phone: string }) =>
  mockRequest(() => {
    const me = actor();
    if (!v.fullName.trim()) throw new ApiError(422, 'Full name is required');
    const phone = v.phone.replace(/\s/g, '');
    if (!PHONE_RE.test(phone)) throw new ApiError(422, 'Phone must be +998XXXXXXXXX');
    me.fullName = v.fullName.trim();
    me.phone = phone;
    return me;
  });

// POST /api/profile/change-password
export const changePassword = (v: { current: string; next: string }) =>
  mockRequest(() => {
    const me = actor();
    if (db.passwords[me.id] !== v.current) throw new ApiError(422, 'Current password is incorrect');
    if (v.next.length < 6) throw new ApiError(422, 'New password must be at least 6 characters');
    db.passwords[me.id] = v.next;
    audit({ actorId: me.id, action: 'USER_PASSWORD_CHANGED', entityType: 'USER', entityId: me.id, entityLabel: me.username });
    return { ok: true };
  }, 500);

const randomCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');

export interface TelegramCode {
  code: string;
  expiresAt: string;
  botUsername: string;
}

// POST /api/telegram/link-code
export const generateTelegramCode = () =>
  mockRequest<TelegramCode>(() => {
    const me = actor();
    if (me.telegram) throw new ApiError(422, 'Telegram is already connected');
    db.telegramCodes = db.telegramCodes.filter((c) => c.userId !== me.id);
    const entry = { userId: me.id, code: randomCode(), createdAt: nowIso(), expiresAt: dayjs().add(CODE_TTL_MIN, 'minute').toISOString() };
    db.telegramCodes.push(entry);
    return { code: entry.code, expiresAt: entry.expiresAt, botUsername: db.settings.telegram.botUsername };
  });

// GET /api/telegram/link-status
export const getTelegramLinkStatus = () =>
  mockRequest(() => {
    const me = actor();
    const pending = db.telegramCodes.find((c) => c.userId === me.id);
    if (!me.telegram && pending && dayjs().isBefore(pending.expiresAt) && dayjs().diff(pending.createdAt) >= SIMULATED_LINK_DELAY) {
      me.telegram = { username: `${me.username}_tg`, chatId: String(100000000 + Math.floor(Math.random() * 899999)), linkedAt: nowIso() };
      db.telegramCodes = db.telegramCodes.filter((c) => c.userId !== me.id);
      db.notificationSettings.filter((s) => s.userId === me.id).forEach((s) => (s.telegram = true));
      audit({ actorId: me.id, action: 'TELEGRAM_LINKED', entityType: 'USER', entityId: me.id, entityLabel: me.username, newValue: { ...me.telegram }, source: 'TELEGRAM' });
    }
    return { linked: !!me.telegram, telegram: me.telegram };
  }, 200);

// DELETE /api/telegram/link
export const disconnectTelegram = () =>
  mockRequest(() => {
    const me = actor();
    const old = me.telegram;
    me.telegram = null;
    db.notificationSettings.filter((s) => s.userId === me.id).forEach((s) => (s.telegram = false));
    audit({ actorId: me.id, action: 'TELEGRAM_UNLINKED', entityType: 'USER', entityId: me.id, entityLabel: me.username, oldValue: old ? { ...old } : null });
    return { ok: true };
  });
