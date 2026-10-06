import type { Comment, ListParams, Priority, Project, Sprint, Task, TaskStatus, TaskType, Team, UserBrief } from '@/shared/types';

export type {
  Activity,
  Attachment,
  CancelRequest,
  Comment,
  DailyPlan,
  Task,
  TaskBlocker,
  TaskStatus,
  TaskWrite,
} from '@/shared/types';

/**
 * GET /tasks/ query params — all filtering happens on the backend. Names follow the backend as it is
 * today (`blocked`, `overdue`, `backlog`, `ordering=priority_order`); it keeps them after adding aliases.
 */
export interface TaskListParams extends ListParams {
  project?: number;
  sprint?: number;
  /** Tasks without a sprint. */
  backlog?: boolean;
  status?: TaskStatus[];
  /** One value — the backend doesn't accept several yet. */
  assignee?: number;
  priority?: Priority[];
  type?: TaskType;
  blocked?: boolean;
  overdue?: boolean;
  deadline_from?: string;
  deadline_to?: string;
}

export type DeadlineFilter = 'today' | 'week' | 'overdue';

/** GET /projects/:id/board/ query params. */
export interface BoardParams {
  /** Default — the project's active sprint. */
  sprint?: number;
  /** Repeated for several values (multi-select needs backend support). */
  assignee?: number[];
  priority?: Priority[];
  blocked?: boolean;
  deadline_to?: string;
  /** NOT IN api.json */
  overdue?: boolean;
  /** NOT IN api.json */
  label?: string;
  search?: string;
}

export type MyTasksBucket = 'today' | 'upcoming' | 'overdue' | 'completed' | 'blocked';

/** GET /me/tasks/ query params. */
export interface MyTasksParams extends ListParams {
  bucket: MyTasksBucket;
  project?: number;
  priority?: Priority;
}

/** POST /tasks/:id/block/, /cancel-request/ */
export interface ReasonPayload {
  reason: string;
}

/** Global search — combines `?search=` of the list endpoints. */
export interface SearchResults {
  tasks: Task[];
  projects: Project[];
  sprints: Sprint[];
  users: (UserBrief & { email?: string; position?: string })[];
  teams: Team[];
  /** NOT IN api.json — comment search (GET /search/?q=). */
  comments?: (Comment & { task: { key: string; title: string } })[];
}
