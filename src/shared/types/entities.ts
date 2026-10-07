// Shapes follow api/api.json (components.schemas) as-is: snake_case, numeric ids, lowercase enums.
// Types marked "NOT IN api.json" describe endpoints the UI needs but the backend doesn't have yet —
// see docs/BACKEND_REQUIREMENTS.md.

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE';
export type UserStatus = 'active' | 'inactive';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ReviewMode = 'direct_done' | 'require_review';
export type SprintStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskType = 'task' | 'bug';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Source = 'web' | 'telegram' | 'api';
export type CancelRequestStatus = 'pending' | 'approved' | 'rejected';
export type DailyPlanStatus = 'planned' | 'worked' | 'not_worked' | 'carried_over' | 'done' | 'blocked';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assigned'
  | 'reassigned'
  | 'blocker_added'
  | 'blocker_resolved'
  | 'comment_added'
  | 'attachment_added'
  | 'moved_sprint'
  | 'reopened'
  | 'cancel_requested'
  | 'cancel_rejected'
  | 'cancelled';

export interface UserBrief {
  id: number;
  full_name: string;
  username: string;
}

export interface TeamBrief {
  id: number;
  name: string;
}

export interface ReferenceBrief {
  id: number;
  name: string;
}

export interface ProjectBrief {
  id: number;
  key: string;
  name: string;
  status: ProjectStatus;
}

export interface SprintBrief {
  id: number;
  name: string;
  status: SprintStatus;
}

/** GET /auth/me/ — the signed-in user (login returns the same shape in `user`). */
export interface Me {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  position: ReferenceBrief | null;
  branch: ReferenceBrief | null;
  team: TeamBrief | null;
  status: UserStatus;
  roles: Role[];
  is_superuser: boolean;
  is_staff: boolean;
  last_login: string | null;
  created_at: string;
  permissions: string[];
}

/** GET /users/ item — used by shared user selects. */
export interface UserOption extends UserBrief {
  email: string;
  phone: string;
  position: ReferenceBrief | null;
  branch: ReferenceBrief | null;
  team: TeamBrief | null;
  status: UserStatus;
  roles: Role[];
}

/** GET /teams/ item. */
export interface Team {
  id: number;
  name: string;
  description: string;
  lead: UserBrief | null;
  members_count: number;
  created_at: string;
  updated_at: string;
}

/** Project.active_sprint / ProjectReport.active_sprint — untyped object in the schema. */
export interface ActiveSprintInfo extends SprintBrief {
  start_date: string;
  end_date: string;
  goal?: string;
}

/** GET /projects/, /projects/:id/ */
export interface Project {
  id: number;
  name: string;
  key: string;
  description: string;
  manager: UserBrief;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  review_mode: ReviewMode;
  members_count: number;
  active_sprint: ActiveSprintInfo | null;
  created_at: string;
  updated_at: string;
  /** NOT IN api.json — member avatars in lists/header. */
  members?: UserBrief[];
  /** NOT IN api.json — non-cancelled tasks / done tasks / done %. */
  tasks_total?: number;
  tasks_done?: number;
  progress?: number;
}

/** POST /projects/, PATCH /projects/:id/ */
export interface ProjectWrite {
  name: string;
  key: string;
  description?: string;
  manager: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProjectStatus;
  review_mode?: ReviewMode;
}

/** GET /projects/{id}/overview/ — About, tasks by status, active sprint, top blockers. */
export interface ProjectOverview {
  id: number;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  lead: UserBrief;
  tasks_by_status: Record<TaskStatus | 'blocked' | 'overdue' | 'total', number>;
  active_sprint: { id: number; name: string; start_date: string; end_date: string; days_left: number } | null;
  top_blockers: {
    id: number;
    task: { id: number; key: string; title: string };
    reason: string;
    blocked_by: UserBrief | null;
    blocked_since: string;
  }[];
}

/** GET /projects/:id/members/ */
export interface ProjectMember {
  id: number;
  full_name: string;
  username: string;
  status: string;
  role_in_project: string;
  added_at: string;
  /** NOT IN api.json — shown in the members table. */
  position?: ReferenceBrief | null;
  roles?: Role[];
  team?: TeamBrief | null;
  active_tasks?: number;
}

/** GET /sprints/, /sprints/:id/ */
export interface Sprint {
  id: number;
  project: ProjectBrief;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** NOT IN api.json — non-cancelled / done task counts for the progress bar. */
  tasks_total?: number;
  tasks_done?: number;
}

/** POST /sprints/, PATCH /sprints/:id/ */
export interface SprintWrite {
  project: number;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
}

/** Task.active_blocker — untyped object in the schema. */
export interface ActiveBlocker {
  id: number;
  reason: string;
  created_by: UserBrief | null;
  created_at: string;
}

/** GET /tasks/, /tasks/:id/ */
export interface Task {
  id: number;
  key: string;
  title: string;
  description: string;
  project: ProjectBrief;
  sprint: SprintBrief | null;
  assignee: UserBrief | null;
  reporter: UserBrief;
  reviewer: UserBrief | null;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  /** Decimal as string, e.g. "2.50". */
  estimate: string | null;
  is_blocked: boolean;
  is_overdue: boolean;
  active_blocker: ActiveBlocker | null;
  cancellation_reason: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** NOT IN api.json — task labels. */
  labels?: string[];
}

/** POST /tasks/, PATCH /tasks/:id/ */
export interface TaskWrite {
  project: number;
  title: string;
  description?: string;
  sprint?: number | null;
  assignee?: number | null;
  reviewer?: number | null;
  type?: TaskType;
  priority?: Priority;
  deadline?: string | null;
  estimate?: string | null;
  /** NOT IN api.json — task labels. */
  labels?: string[];
}

export interface Comment {
  id: number;
  author: UserBrief | null;
  text: string;
  created_at: string;
  edited_at: string | null;
}

export interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  uploaded_by: UserBrief | null;
  created_at: string;
}

export interface Activity {
  id: number;
  actor: UserBrief | null;
  action: ActivityAction;
  old_value: string;
  new_value: string;
  source: Source;
  created_at: string;
  /** NOT IN api.json — needed by project/dashboard activity feeds. */
  task?: { id: number; key: string; title: string };
}

export interface CancelRequest {
  id: number;
  status: CancelRequestStatus;
  reason: string;
  requested_by: UserBrief;
  reviewed_by: UserBrief | null;
  reviewed_at: string | null;
  created_at: string;
}

/** NOT IN api.json — GET /tasks/:id/blockers/ */
export interface TaskBlocker {
  id: number;
  reason: string;
  created_by: UserBrief | null;
  created_at: string;
  resolved_by: UserBrief | null;
  resolved_at: string | null;
}

/** GET /projects/:id/board/ */
export interface BoardColumn {
  status: TaskStatus;
  title: string;
  count: number;
  tasks: Task[];
}

export interface Board {
  project: ProjectBrief;
  sprint: SprintBrief | null;
  columns: BoardColumn[];
  summary: Record<string, number>;
}

/** GET /me/tasks/summary/ */
export interface MyTasksSummary {
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
  blocked: number;
}

export interface DailyPlanItem {
  id: number;
  planned_status: DailyPlanStatus;
  note: string;
  task: Task;
}

/** GET /me/daily-plan/ */
export interface DailyPlan {
  id: number;
  date: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  /** NOT IN api.json — where the plan was confirmed. */
  confirmed_via?: Source | null;
  note: string;
  items: DailyPlanItem[];
  created_at: string;
}

export interface ReportTaskLine {
  key: string;
  title: string;
  status: TaskStatus;
  planned_status: DailyPlanStatus | '';
  reason: string | null;
  /** NOT IN api.json */
  priority?: Priority;
}

/** GET /me/daily-report/, /reports/users/:id/daily/ */
export interface DailyReport {
  date: string;
  completed: number;
  in_progress: number;
  blocked: number;
  cancelled: number;
  not_started: number;
  total: number;
  progress_percent: number;
  note: string;
  generated_at: string;
  completed_tasks: ReportTaskLine[];
  blocked_tasks: ReportTaskLine[];
  not_completed_tasks: ReportTaskLine[];
  /** NOT IN api.json — whose report it is, plan confirmation, finer task groups. */
  user?: UserBrief;
  plan_confirmed_at?: string | null;
  confirmed_via?: Source | null;
  in_progress_tasks?: ReportTaskLine[];
  cancelled_tasks?: ReportTaskLine[];
  not_started_tasks?: ReportTaskLine[];
}

export interface TeamDailyMemberRow {
  user: UserBrief;
  has_plan: boolean;
  completed: number;
  total: number;
  unfinished: number;
  blocked: number;
  progress_percent: number;
  /** NOT IN api.json */
  confirmed_at?: string | null;
}

/** GET /reports/teams/:id/daily/ */
export interface TeamDailyReport {
  team: TeamBrief;
  date: string;
  members: TeamDailyMemberRow[];
  team_progress_percent: number;
  blockers: number;
  /** NOT IN api.json — the blocked tasks behind `blockers`. */
  blocker_tasks?: (ReportTaskLine & { assignee: UserBrief | null })[];
}

/** GET /reports/sprints/:id/ */
export interface SprintReport {
  sprint: ActiveSprintInfo;
  is_snapshot: boolean;
  total: number;
  completed: number;
  unfinished: number;
  cancelled: number;
  blocked: number;
  overdue: number;
  completion_percent: number;
  moved_to_backlog: number;
  generated_at: string | null;
  /** NOT IN api.json — which tasks were moved and where. */
  moved_tasks?: ReportTaskLine[];
  moved_to?: SprintBrief | null;
}

/** GET /reports/projects/:id/ */
export interface ProjectReport {
  project: ProjectBrief;
  total_tasks: number;
  by_status: Partial<Record<TaskStatus, number>>;
  blocked: number;
  overdue: number;
  completion_percent: number;
  active_sprint: ActiveSprintInfo | null;
  sprints_completed: number;
  members_count: number;
  /** NOT IN api.json — open tasks per priority / active tasks per member. */
  by_priority?: Partial<Record<Priority, number>>;
  workload?: { user: UserBrief; active: number }[];
}

/** GET /telegram/account/ */
export interface TelegramAccount {
  linked: boolean;
  tg_username?: string;
  is_active?: boolean;
  linked_at?: string | null;
}

/** POST /telegram/link-token/ */
export interface TelegramLinkToken {
  token: string;
  deep_link: string | null;
  expires_at: string;
}

// ───────────── notifications · audit · settings ─────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_reassigned'
  | 'deadline_approaching'
  | 'task_overdue'
  | 'task_blocked'
  | 'blocker_resolved'
  | 'comment_added'
  | 'user_mentioned'
  | 'sprint_started'
  | 'sprint_ending'
  | 'daily_reminder'
  | 'daily_report'
  | 'cancel_requested';

/** GET /notifications/ */
export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: 'task' | 'sprint' | 'project' | 'report';
  /** Related entity ID. */
  entity_id: string;
  is_read: boolean;
  created_at: string;
}

/** GET /notification-settings/ item (UI shape). */
export interface NotificationSetting {
  event: NotificationType;
  /** Backend's human-readable event name. */
  label?: string;
  telegram: boolean;
  web: boolean;
}

export type AuditEntityType = 'task' | 'project' | 'sprint' | 'user' | 'team' | 'settings' | 'references.branch' | 'references.position';

/** GET /audit-logs/ */
export interface AuditLog {
  id: number;
  actor: UserBrief | null;
  action: string;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_label: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string;
  source: Source;
  created_at: string;
}

/** GET /settings/ grouped for the settings UI (the backend returns a flat object — see shared/lib/settingsShape.ts). */
export interface AppSettings {
  general: { company_name: string; timezone: string; working_days: number[]; work_start: string; work_end: string };
  telegram: { bot_username: string; enabled: boolean; morning_time: string; reminders_time?: string; evening_time: string };
  tasks: { default_priority: Priority; require_review: boolean; max_attachment_mb: number; allowed_file_types: string[] };
  sprint: { default_duration_days: number };
  workflow_settings?: Record<string, unknown>;
}
