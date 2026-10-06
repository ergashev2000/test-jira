// Backend → UI shape adapters for responses that differ from the types in shared/types today
// (docs/FRONTEND_INTEGRATION_GUIDE.md §4). Each accepts both shapes, so it keeps working once
// the backend switches to the documented one — then the adapter can simply be deleted.
import type { ApiPaginated, DailyReport, UserBrief } from '@/shared/types';

/** Some list endpoints (project/team members, roles, permissions) return a plain array, others paginate. */
export const asPage = <T,>(data: T[] | ApiPaginated<T>): ApiPaginated<T> =>
  Array.isArray(data) ? { count: data.length, next: null, previous: null, results: data } : data;

export const asList = <T,>(data: T[] | ApiPaginated<T>): T[] => (Array.isArray(data) ? data : data.results);

type RawBlocker = { id: number; reason: string; blocked_by?: string | UserBrief | null; since?: string; created_by?: UserBrief | null; created_at?: string };

const userFrom = (v: string | UserBrief | null | undefined): UserBrief | null =>
  !v ? null : typeof v === 'string' ? { id: 0, full_name: v, username: v } : v;

/** `active_blocker` today: `{id, reason, blocked_by: "username", since}` → `{id, reason, created_by, created_at}`. */
const fixBlocker = (b: RawBlocker | null) =>
  b && !('created_at' in b) ? { id: b.id, reason: b.reason, created_by: userFrom(b.blocked_by), created_at: b.since ?? '' } : b;

/**
 * Applied to every JSON response (axios interceptor): rewrites `active_blocker` wherever a task
 * appears — lists, board columns, detail, action results.
 */
export const normalizeResponse = (data: unknown): unknown => {
  if (Array.isArray(data)) {
    data.forEach(normalizeResponse);
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('active_blocker' in obj) obj.active_blocker = fixBlocker(obj.active_blocker as RawBlocker | null);
    Object.values(obj).forEach((v) => v && typeof v === 'object' && normalizeResponse(v));
  }
  return data;
};

/** GET /reports/users/:id/daily/ may come without the task groups — UI expects arrays. */
export const normalizeDailyReport = (r: DailyReport): DailyReport => ({
  ...r,
  completed_tasks: r.completed_tasks ?? [],
  blocked_tasks: r.blocked_tasks ?? [],
  not_completed_tasks: r.not_completed_tasks ?? [],
});
