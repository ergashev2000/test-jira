import { hasPermission, MANAGER_ROLES, TASK_STATUS } from '@/shared/constants';
import type { Task, TaskStatus, User } from '@/shared/types';

/**
 * Contextual task rules. Shared by UI (to disable/hide) and the mock API
 * (to reject with 403/422) so both enforce the same behaviour.
 */
export type Actor = Pick<User, 'id' | 'role'>;
type TaskLike = Pick<Task, 'assigneeId' | 'reviewerId' | 'status'>;

export const isManager = (a: Actor) => MANAGER_ROLES.includes(a.role);

export const canEditTask = (a: Actor) => hasPermission(a.role, 'task.edit');

export const canChangeStatus = (a: Actor, t: TaskLike) =>
  hasPermission(a.role, 'task.changeStatus') || t.assigneeId === a.id || t.reviewerId === a.id;

export const canApproveReview = (a: Actor, t: TaskLike) =>
  hasPermission(a.role, 'task.review.approve') || t.reviewerId === a.id;

export const canBlock = (a: Actor, t: TaskLike) => hasPermission(a.role, 'task.block') || t.assigneeId === a.id;

export const canCancelDirect = (a: Actor) => hasPermission(a.role, 'task.cancel');

export const canRequestCancel = (a: Actor, t: TaskLike) => !canCancelDirect(a) && t.assigneeId === a.id;

export type TransitionResult =
  | { ok: true; status: TaskStatus; note?: string; reopen: boolean }
  | { ok: false; reason: string };

/**
 * Validates a status move and resolves the effective target status
 * (e.g. DONE → REVIEW when review is required).
 */
export const resolveTransition = (
  a: Actor,
  t: TaskLike,
  to: TaskStatus,
  requireReview: boolean,
): TransitionResult => {
  if (t.status === to) return { ok: false, reason: 'Task is already in this status' };
  if (t.status === 'CANCELLED') return { ok: false, reason: 'Cancelled task cannot be moved' };
  if (to === 'CANCELLED') return { ok: false, reason: 'Use "Cancel task" with a reason' };
  if (!canChangeStatus(a, t)) return { ok: false, reason: 'You can only move tasks assigned to you' };

  const reopen = t.status === 'DONE';
  if (to === 'DONE' && requireReview) {
    if (t.status !== 'REVIEW') {
      return { ok: true, status: 'REVIEW', note: 'Sent to review', reopen };
    }
    if (!canApproveReview(a, t)) {
      return { ok: false, reason: 'Only the reviewer or a lead can approve this task' };
    }
  }
  return { ok: true, status: to, reopen };
};

export const statusLabel = (s: TaskStatus) => TASK_STATUS[s].label;
