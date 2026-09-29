import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';

type DateInput = string | Date | null | undefined;

export const formatDate = (v: DateInput, fallback = '—') => (v ? dayjs(v).format(DATE_FORMAT) : fallback);
export const formatTime = (v: DateInput, fallback = '—') => (v ? dayjs(v).format(TIME_FORMAT) : fallback);
export const formatDateTime = (v: DateInput, fallback = '—') => (v ? dayjs(v).format(DATETIME_FORMAT) : fallback);
export const fromNow = (v: DateInput, fallback = '—') => (v ? dayjs(v).fromNow() : fallback);

/** 'YYYY-MM-DD' of today (local). */
export const todayIso = () => dayjs().format('YYYY-MM-DD');

/** Days from today to date (negative = past). */
export const daysFromToday = (v: string) => dayjs(v).startOf('day').diff(dayjs().startOf('day'), 'day');

export const isToday = (v: DateInput) => !!v && dayjs(v).isSame(dayjs(), 'day');

/** Human duration between two instants: "2d 4h", "35m". */
export const humanDuration = (from: string, to: string | null = null) => {
  const mins = Math.max(0, dayjs(to ?? undefined).diff(dayjs(from), 'minute'));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
};
