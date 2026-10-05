import { hasPermission, MANAGER_ROLES, primaryRole, TASK_STATUS } from '@/shared/constants';
import type { Me, Task, TaskStatus } from '@/shared/types';

/**
 * Contextual task rules for the UI (hide/disable actions). The backend enforces the same rules
 * and has the final word — e.g. it decides whether "done" goes through review.
 */
export type Actor = Pick<Me, 'id' | 'roles'>;
type TaskLike = Pick<Task, 'assignee' | 'reviewer' | 'status'>;

const role = (a: Actor) => primaryRole(a.roles);

export const isManager = (a: Actor) => MANAGER_ROLES.includes(role(a));

export const canEditTask = (a: Actor) => hasPermission(role(a), 'task.edit');

export const canChangeStatus = (a: Actor, t: TaskLike) =>
  hasPermission(role(a), 'task.changeStatus') || t.assignee?.id === a.id || t.reviewer?.id === a.id;

export const canBlock = (a: Actor, t: TaskLike) => hasPermission(role(a), 'task.block') || t.assignee?.id === a.id;

export const canCancelDirect = (a: Actor) => hasPermission(role(a), 'task.cancel');

export const canRequestCancel = (a: Actor, t: TaskLike) => !canCancelDirect(a) && t.assignee?.id === a.id;

export type TransitionResult = { ok: true; reopen: boolean } | { ok: false; reason: string };

/** Client-side pre-check of a status move; the backend validates it again. */
export const checkTransition = (a: Actor, t: TaskLike, to: TaskStatus): TransitionResult => {
  if (t.status === to) return { ok: false, reason: 'Task is already in this status' };
  if (t.status === 'cancelled') return { ok: false, reason: 'Cancelled task cannot be moved' };
  if (to === 'cancelled') return { ok: false, reason: 'Use "Cancel task" with a reason' };
  if (!canChangeStatus(a, t)) return { ok: false, reason: 'You can only move tasks assigned to you' };
  return { ok: true, reopen: t.status === 'done' };
};

export const statusLabel = (s: TaskStatus) => TASK_STATUS[s].label;
