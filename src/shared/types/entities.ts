import type { ID } from './common';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type TaskType = 'TASK' | 'BUG';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Source = 'WEB' | 'TELEGRAM' | 'API';
export type CancelReason = 'REQUIREMENT_CHANGED' | 'NO_LONGER_NEEDED' | 'DUPLICATE' | 'OTHER';
export type DailyTaskStatus = 'PLANNED' | 'WORKED' | 'NOT_WORKED' | 'CARRIED_OVER';

export interface TelegramLink {
  username: string;
  chatId: string;
  linkedAt: string;
}

export interface User {
  id: ID;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  position: string;
  teamId: ID | null;
  role: Role;
  status: UserStatus;
  telegram: TelegramLink | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Team {
  id: ID;
  name: string;
  leadId: ID;
  memberIds: ID[];
  createdAt: string;
}

export interface Project {
  id: ID;
  name: string;
  key: string;
  description: string;
  managerId: ID;
  memberIds: ID[];
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  taskCounter: number;
  createdAt: string;
}

export interface Sprint {
  id: ID;
  projectId: ID;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface TaskCancellation {
  reason: CancelReason;
  note: string;
  byId: ID;
  at: string;
}

export interface Task {
  id: ID;
  key: string;
  title: string;
  description: string;
  type: TaskType;
  projectId: ID;
  sprintId: ID | null;
  assigneeId: ID | null;
  reporterId: ID;
  reviewerId: ID | null;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  estimate: number | null;
  labels: string[];
  isBlocked: boolean;
  cancellation: TaskCancellation | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface TaskBlocker {
  id: ID;
  taskId: ID;
  reason: string;
  createdById: ID;
  createdAt: string;
  resolvedById: ID | null;
  resolvedAt: string | null;
}

export interface CancelRequest {
  id: ID;
  taskId: ID;
  requestedById: ID;
  reason: CancelReason;
  note: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedById: ID | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface TaskComment {
  id: ID;
  taskId: ID;
  authorId: ID;
  text: string;
  createdAt: string;
  editedAt: string | null;
}

export interface TaskAttachment {
  id: ID;
  taskId: ID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedById: ID;
  createdAt: string;
}

export type ActivityAction =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'DEADLINE_CHANGED'
  | 'SPRINT_CHANGED'
  | 'BLOCKED'
  | 'BLOCKER_RESOLVED'
  | 'CANCELLED'
  | 'CANCEL_REQUESTED'
  | 'COMMENTED'
  | 'ATTACHMENT_ADDED'
  | 'REOPENED';

export interface TaskActivity {
  id: ID;
  taskId: ID;
  projectId: ID;
  actorId: ID;
  action: ActivityAction;
  oldValue: string | null;
  newValue: string | null;
  source: Source;
  createdAt: string;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'DEADLINE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'TASK_BLOCKED'
  | 'BLOCKER_RESOLVED'
  | 'COMMENT_ADDED'
  | 'SPRINT_STARTED'
  | 'SPRINT_ENDING'
  | 'DAILY_REMINDER'
  | 'DAILY_REPORT'
  | 'CANCEL_REQUESTED';

export interface AppNotification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  message: string;
  entityType: 'TASK' | 'SPRINT' | 'PROJECT' | 'REPORT';
  entityId: ID;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSetting {
  userId: ID;
  event: NotificationType;
  telegram: boolean;
  web: boolean;
}

export type AuditEntityType = 'TASK' | 'PROJECT' | 'SPRINT' | 'USER' | 'TEAM' | 'SETTINGS';

export interface AuditLog {
  id: ID;
  actorId: ID;
  action: string;
  entityType: AuditEntityType;
  entityId: ID;
  entityLabel: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  source: Source;
  createdAt: string;
}

export interface DailyPlan {
  id: ID;
  userId: ID;
  date: string;
  confirmedAt: string | null;
  confirmedVia: Source | null;
  tasks: { taskId: ID; dailyStatus: DailyTaskStatus }[];
  note: string | null;
}

export interface SprintReport {
  sprintId: ID;
  generatedAt: string;
  totalTasks: number;
  completed: number;
  unfinished: number;
  cancelled: number;
  blocked: number;
  overdue: number;
  completionPercent: number;
  movedTaskIds: ID[];
  movedTo: 'BACKLOG' | ID;
}

export interface AppSettings {
  general: { companyName: string; timezone: string; workingDays: number[]; workStart: string; workEnd: string };
  telegram: { botUsername: string; enabled: boolean; morningTime: string; eveningTime: string };
  tasks: { defaultPriority: Priority; requireReview: boolean; maxAttachmentMb: number; allowedFileTypes: string[] };
  sprint: { defaultDurationDays: number };
}

/** Activity enriched for display (actor name + task key). */
export interface ActivityItem extends TaskActivity {
  actorName: string;
  taskKey: string;
  taskTitle: string;
}

/** Lightweight user shape used inside other entities' responses. */
export type UserBrief = Pick<User, 'id' | 'fullName' | 'username' | 'role' | 'status' | 'position'>;
