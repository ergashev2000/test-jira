import { CLOSED_STATUSES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type { Task } from '@/shared/types';

/** Overdue is computed, never stored: deadline passed and task not closed. */
export const isOverdue = (task: Pick<Task, 'deadline' | 'status'>): boolean =>
  !!task.deadline &&
  dayjs(task.deadline).isBefore(dayjs(), 'day') &&
  !CLOSED_STATUSES.includes(task.status);

export const isClosed = (task: Pick<Task, 'status'>) => CLOSED_STATUSES.includes(task.status);

/** Active = not DONE and not CANCELLED. */
export const isActiveTask = (task: Pick<Task, 'status'>) => !isClosed(task);
