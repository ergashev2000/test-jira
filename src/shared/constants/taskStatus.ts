import type { CancelReason, TaskStatus, TaskType } from '@/shared/types';

export const TASK_STATUS: Record<TaskStatus, { label: string; color: string; tag: string }> = {
  BACKLOG: { label: 'Backlog', color: '#8a8f98', tag: 'default' },
  TODO: { label: 'To Do', color: 'var(--c-status-todo)', tag: 'blue' },
  IN_PROGRESS: { label: 'In Progress', color: '#f2c94c', tag: 'gold' },
  REVIEW: { label: 'Review', color: '#a78bfa', tag: 'purple' },
  DONE: { label: 'Done', color: '#4cb782', tag: 'green' },
  CANCELLED: { label: 'Cancelled', color: '#6b6f76', tag: 'default' },
};

export const STATUS_ORDER: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
/** Kanban columns — exactly 5, no Cancelled / Blocked columns. */
export const BOARD_COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
export const CLOSED_STATUSES: TaskStatus[] = ['DONE', 'CANCELLED'];

/** Status options selectable from a status dropdown (cancel has its own flow). */
export const STATUS_OPTIONS = BOARD_COLUMNS.map((s) => ({ value: s, label: TASK_STATUS[s].label }));

export const CANCEL_REASONS: Record<CancelReason, string> = {
  REQUIREMENT_CHANGED: 'Requirement changed',
  NO_LONGER_NEEDED: 'Task no longer needed',
  DUPLICATE: 'Duplicate',
  OTHER: 'Other',
};

export const TASK_TYPES: Record<TaskType, { label: string; color: string }> = {
  TASK: { label: 'Task', color: '#5e9bf2' },
  BUG: { label: 'Bug', color: '#eb5757' },
};
