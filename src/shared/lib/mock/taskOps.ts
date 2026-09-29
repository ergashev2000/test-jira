import type { Source, Task, TaskStatus, User } from '@/shared/types';

import { audit, leadsOf, logActivity, nameOf, notify } from './effects';
import { db, nowIso } from './mockDb';

/**
 * Low-level status change with all side effects. Validation is done by the caller
 * (API layer) so the Telegram simulator can reuse it.
 */
export const applyStatusChange = (task: Task, by: User, to: TaskStatus, source: Source = 'WEB', reopen = false) => {
  const from = task.status;
  task.status = to;
  task.updatedAt = nowIso();
  task.completedAt = to === 'DONE' ? nowIso() : null;
  logActivity(task, by.id, reopen ? 'REOPENED' : 'STATUS_CHANGED', from, to, source);
  audit({
    actorId: by.id,
    action: reopen ? 'TASK_REOPENED' : 'TASK_STATUS_CHANGED',
    entityType: 'TASK',
    entityId: task.id,
    entityLabel: task.key,
    oldValue: { status: from },
    newValue: { status: to },
    source,
  });
  if (to === 'REVIEW' && task.reviewerId) {
    notify(task.reviewerId, 'TASK_ASSIGNED', 'Review requested', `${nameOf(by)} sent ${task.key} · ${task.title} to review`, 'TASK', task.key, by.id);
  }
};

export const applyAssign = (task: Task, by: User, assigneeId: string | null) => {
  const prev = task.assigneeId;
  if (prev === assigneeId) return;
  task.assigneeId = assigneeId;
  task.updatedAt = nowIso();
  logActivity(task, by.id, 'ASSIGNED', prev, assigneeId);
  audit({
    actorId: by.id, action: 'TASK_ASSIGNED', entityType: 'TASK', entityId: task.id, entityLabel: task.key,
    oldValue: { assigneeId: prev }, newValue: { assigneeId },
  });
  notify(assigneeId, prev ? 'TASK_REASSIGNED' : 'TASK_ASSIGNED', 'New task assigned',
    `${task.key} · ${task.title} was assigned to you by ${nameOf(by)}`, 'TASK', task.key, by.id);
};

export const notifyLeads = (task: Task, by: User, type: 'TASK_BLOCKED' | 'BLOCKER_RESOLVED' | 'CANCEL_REQUESTED', title: string, message: string) => {
  for (const id of leadsOf(task)) notify(id, type, title, message, 'TASK', task.key, by.id);
};

export const activeBlocker = (taskId: string) => db.taskBlockers.find((b) => b.taskId === taskId && !b.resolvedAt) ?? null;
