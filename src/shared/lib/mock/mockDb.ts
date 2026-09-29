import type {
  AppNotification,
  AppSettings,
  AuditLog,
  CancelRequest,
  DailyPlan,
  NotificationSetting,
  Project,
  Sprint,
  SprintReport,
  Task,
  TaskActivity,
  TaskAttachment,
  TaskBlocker,
  TaskComment,
  Team,
  User,
} from '@/shared/types';

import { auditLogs, taskActivity } from './data/activity';
import {
  dailyPlans,
  notifications,
  notificationSettings,
  settings,
  sprintReports,
} from './data/misc';
import { projects, sprints } from './data/projects';
import { cancelRequests, taskAttachments, taskBlockers, taskComments } from './data/taskMeta';
import { tasks } from './data/tasks';
import { MOCK_PASSWORD, teams, users } from './data/users';

export interface MockDb {
  users: User[];
  passwords: Record<string, string>;
  teams: Team[];
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  taskBlockers: TaskBlocker[];
  cancelRequests: CancelRequest[];
  taskComments: TaskComment[];
  taskAttachments: TaskAttachment[];
  taskActivity: TaskActivity[];
  notifications: AppNotification[];
  notificationSettings: NotificationSetting[];
  auditLogs: AuditLog[];
  dailyPlans: DailyPlan[];
  sprintReports: SprintReport[];
  settings: AppSettings;
  telegramCodes: { userId: string; code: string; expiresAt: string; createdAt: string }[];
}

/** In-memory DB — deep copy of seed. Lives until page reload (no localStorage by design). */
export const db: MockDb = structuredClone({
  users,
  passwords: Object.fromEntries(users.map((u) => [u.id, MOCK_PASSWORD])),
  teams,
  projects,
  sprints,
  tasks,
  taskBlockers,
  cancelRequests,
  taskComments,
  taskAttachments,
  taskActivity,
  notifications,
  notificationSettings,
  auditLogs,
  dailyPlans,
  sprintReports,
  settings,
  telegramCodes: [],
});

let seq = 1000;
export const uid = (prefix: string) => `${prefix}${++seq}`;
export const nowIso = () => new Date().toISOString();
