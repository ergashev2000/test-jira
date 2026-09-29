import type {
  ActivityAction,
  AppNotification,
  AuditEntityType,
  NotificationType,
  Source,
  Task,
  User,
} from '@/shared/types';

import { db, nowIso, uid } from './mockDb';

export const MOCK_IP = '192.168.1.10';

/** Side effects every mutation writes — like backend domain events. */
export const logActivity = (
  task: Task,
  actorId: string,
  action: ActivityAction,
  oldValue: string | null,
  newValue: string | null,
  source: Source = 'WEB',
) => {
  db.taskActivity.unshift({
    id: uid('act'),
    taskId: task.id,
    projectId: task.projectId,
    actorId,
    action,
    oldValue,
    newValue,
    source,
    createdAt: nowIso(),
  });
};

export const audit = (params: {
  actorId: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  source?: Source;
}) => {
  db.auditLogs.unshift({
    id: uid('al'),
    oldValue: null,
    newValue: null,
    ...params,
    source: params.source ?? 'WEB',
    ipAddress: params.source === 'TELEGRAM' ? '149.154.167.99' : MOCK_IP,
    createdAt: nowIso(),
  });
};

export const notify = (
  userId: string | null | undefined,
  type: NotificationType,
  title: string,
  message: string,
  entityType: AppNotification['entityType'],
  entityId: string,
  exceptUserId?: string,
) => {
  if (!userId || userId === exceptUserId) return;
  const setting = db.notificationSettings.find((s) => s.userId === userId && s.event === type);
  if (setting && !setting.web) return;
  db.notifications.unshift({
    id: uid('n'),
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    isRead: false,
    createdAt: nowIso(),
  });
};

/** Team lead of assignee + project manager — recipients of escalation events. */
export const leadsOf = (task: Task): string[] => {
  const assignee = db.users.find((u) => u.id === task.assigneeId);
  const team = db.teams.find((t) => t.id === assignee?.teamId);
  const project = db.projects.find((p) => p.id === task.projectId);
  return [...new Set([team?.leadId, project?.managerId].filter((x): x is string => !!x))];
};

export const nameOf = (u: User | undefined) => u?.fullName ?? 'Someone';
