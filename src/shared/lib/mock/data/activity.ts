import type { AuditLog, TaskActivity } from '@/shared/types';

import dayjs from '@/shared/lib/dayjs';

import { dt } from './helpers';
import { taskBlockers, taskComments } from './taskMeta';
import { tasks } from './tasks';

/**
 * Activity is derived from seed tasks so history always matches their state.
 */
const build = (): TaskActivity[] => {
  const list: TaskActivity[] = [];
  let n = 0;
  const push = (a: Omit<TaskActivity, 'id'>) => list.push({ id: `act${++n}`, ...a });

  for (const task of tasks) {
    const base = { taskId: task.id, projectId: task.projectId };
    push({ ...base, actorId: task.reporterId, action: 'CREATED', oldValue: null, newValue: task.key, source: 'WEB', createdAt: task.createdAt });
    if (task.assigneeId) {
      push({ ...base, actorId: task.reporterId, action: 'ASSIGNED', oldValue: null, newValue: task.assigneeId, source: 'WEB',
        createdAt: dayjs(task.createdAt).add(5, 'minute').toISOString() });
    }
    const actor = task.assigneeId ?? task.reporterId;
    const viaTg = task.assigneeId === 'u5' || task.assigneeId === 'u6';
    if (['IN_PROGRESS', 'REVIEW', 'DONE'].includes(task.status)) {
      push({ ...base, actorId: actor, action: 'STATUS_CHANGED', oldValue: 'TODO', newValue: 'IN_PROGRESS',
        source: viaTg ? 'TELEGRAM' : 'WEB', createdAt: dayjs(task.createdAt).add(1, 'day').hour(10).minute(30).toISOString() });
    }
    if (task.status === 'REVIEW' || (task.status === 'DONE' && task.reviewerId)) {
      push({ ...base, actorId: actor, action: 'STATUS_CHANGED', oldValue: 'IN_PROGRESS', newValue: 'REVIEW', source: 'WEB',
        createdAt: task.status === 'REVIEW' ? task.updatedAt : dayjs(task.completedAt).subtract(2, 'hour').toISOString() });
    }
    if (task.status === 'DONE' && task.completedAt) {
      push({ ...base, actorId: task.reviewerId ?? actor, action: 'STATUS_CHANGED',
        oldValue: task.reviewerId ? 'REVIEW' : 'IN_PROGRESS', newValue: 'DONE',
        source: viaTg && !task.reviewerId ? 'TELEGRAM' : 'WEB', createdAt: task.completedAt });
    }
    if (task.cancellation) {
      push({ ...base, actorId: task.cancellation.byId, action: 'CANCELLED', oldValue: 'TODO', newValue: 'CANCELLED', source: 'WEB',
        createdAt: task.cancellation.at });
    }
  }
  for (const b of taskBlockers) {
    const task = tasks.find((x) => x.id === b.taskId)!;
    push({ taskId: b.taskId, projectId: task.projectId, actorId: b.createdById, action: 'BLOCKED', oldValue: null, newValue: b.reason,
      source: 'TELEGRAM', createdAt: b.createdAt });
    if (b.resolvedAt && b.resolvedById) {
      push({ taskId: b.taskId, projectId: task.projectId, actorId: b.resolvedById, action: 'BLOCKER_RESOLVED', oldValue: b.reason,
        newValue: null, source: 'WEB', createdAt: b.resolvedAt });
    }
  }
  for (const c of taskComments) {
    const task = tasks.find((x) => x.id === c.taskId)!;
    push({ taskId: c.taskId, projectId: task.projectId, actorId: c.authorId, action: 'COMMENTED', oldValue: null,
      newValue: c.text.slice(0, 80), source: 'WEB', createdAt: c.createdAt });
  }
  push({ taskId: 'k15', projectId: 'p1', actorId: 'u7', action: 'CANCEL_REQUESTED', oldValue: null, newValue: 'NO_LONGER_NEEDED',
    source: 'WEB', createdAt: dt(-1, '16:20') });
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const taskActivity: TaskActivity[] = build();

const IP = '192.168.1.10';

const seedAudit: AuditLog[] = [
  ...taskActivity
    .filter((a) => a.action !== 'CREATED')
    .map<AuditLog>((a, i) => {
      const task = tasks.find((x) => x.id === a.taskId)!;
      const field = a.action === 'ASSIGNED' ? 'assigneeId' : a.action === 'COMMENTED' ? 'comment' : 'status';
      return {
        id: `al${i + 1}`, actorId: a.actorId, action: a.action === 'STATUS_CHANGED' ? 'TASK_STATUS_CHANGED' : `TASK_${a.action}`,
        entityType: 'TASK', entityId: task.id, entityLabel: task.key,
        oldValue: a.oldValue ? { [field]: a.oldValue } : null, newValue: a.newValue ? { [field]: a.newValue } : null,
        ipAddress: a.source === 'TELEGRAM' ? '149.154.167.99' : IP, source: a.source, createdAt: a.createdAt,
      };
    }),
  { id: 'al900', actorId: 'u2', action: 'USER_CREATED', entityType: 'USER', entityId: 'u7', entityLabel: 'malika',
    oldValue: null, newValue: { role: 'EMPLOYEE', teamId: 't1' }, ipAddress: IP, source: 'WEB', createdAt: dt(-80) },
  { id: 'al901', actorId: 'u2', action: 'USER_DEACTIVATED', entityType: 'USER', entityId: 'u9', entityLabel: 'otabek',
    oldValue: { status: 'ACTIVE' }, newValue: { status: 'INACTIVE' }, ipAddress: IP, source: 'WEB', createdAt: dt(-19, '15:00') },
  { id: 'al902', actorId: 'u3', action: 'SPRINT_STARTED', entityType: 'SPRINT', entityId: 's2', entityLabel: 'CRM · Sprint 2',
    oldValue: { status: 'PLANNED' }, newValue: { status: 'ACTIVE' }, ipAddress: IP, source: 'WEB', createdAt: dt(-10, '09:00') },
  { id: 'al903', actorId: 'u1', action: 'SETTINGS_UPDATED', entityType: 'SETTINGS', entityId: 'tasks', entityLabel: 'Tasks settings',
    oldValue: { requireReview: false }, newValue: { requireReview: true }, ipAddress: IP, source: 'WEB', createdAt: dt(-30, '12:00') },
  { id: 'al904', actorId: 'u3', action: 'PROJECT_CREATED', entityType: 'PROJECT', entityId: 'p3', entityLabel: 'MOB',
    oldValue: null, newValue: { name: 'Mobile App', status: 'PLANNING' }, ipAddress: IP, source: 'WEB', createdAt: dt(-5) },
];

export const auditLogs = seedAudit.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
