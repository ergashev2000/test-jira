import type { TaskStatus, TaskType } from '@/shared/types';

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string; tag: string }> = {
  backlog: { label: 'Backlog', color: '#8a8f98', tag: 'default' },
  todo: { label: 'To Do', color: 'var(--c-status-todo)', tag: 'blue' },
  in_progress: { label: 'In Progress', color: '#f2c94c', tag: 'gold' },
  review: { label: 'Review', color: '#a78bfa', tag: 'purple' },
  ready_for_testing: { label: 'Ready for testing', color: '#2dd4bf', tag: 'cyan' },
  done: { label: 'Done', color: '#4cb782', tag: 'green' },
  cancelled: { label: 'Cancelled', color: '#6b6f76', tag: 'default' },
};

export const STATUS_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'ready_for_testing', 'done', 'cancelled'];
/** Kanban columns — no Cancelled / Blocked columns. */
export const BOARD_COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'ready_for_testing', 'done'];
export const CLOSED_STATUSES: TaskStatus[] = ['done', 'cancelled'];

/** Status options selectable from a status dropdown (cancel has its own flow). */
export const STATUS_OPTIONS = BOARD_COLUMNS.map((s) => ({ value: s, label: TASK_STATUS[s].label }));

/** Preset cancel reasons; the backend stores the reason as free text (`Reason.reason`). */
export const CANCEL_REASONS = {
  REQUIREMENT_CHANGED: 'Requirement changed',
  NO_LONGER_NEEDED: 'Task no longer needed',
  DUPLICATE: 'Duplicate',
  OTHER: 'Other',
} as const;
export type CancelReason = keyof typeof CANCEL_REASONS;

export const TASK_TYPES: Record<TaskType, { label: string; color: string }> = {
  task: { label: 'Task', color: '#5e9bf2' },
  bug: { label: 'Bug', color: '#eb5757' },
};
