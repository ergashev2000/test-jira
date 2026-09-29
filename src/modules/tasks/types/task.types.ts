import type {
  CancelReason,
  CancelRequest,
  Priority,
  Task,
  TaskBlocker,
  TaskStatus,
  TaskType,
} from '@/shared/types';

export type {
  ActivityItem,
  CancelRequest,
  Task,
  TaskAttachment,
  TaskBlocker,
  TaskComment,
  TaskStatus,
  DailyPlan,
} from '@/shared/types';

export type DeadlineFilter = 'today' | 'week' | 'overdue';

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  /** 'backlog' = no sprint, 'active' = project's active sprint(s), or a sprint id. */
  sprintId?: string;
  assigneeIds?: string[];
  priorities?: Priority[];
  statuses?: TaskStatus[];
  search?: string;
  onlyBlocked?: boolean;
  deadline?: DeadlineFilter;
  label?: string;
  includeCancelled?: boolean;
}

export interface TaskRow extends Task {
  projectKey: string;
  projectName: string;
  sprintName: string | null;
  blockerReason: string | null;
}

export interface TaskDetail extends TaskRow {
  activeBlocker: TaskBlocker | null;
  pendingCancelRequest: CancelRequest | null;
  projectArchived: boolean;
  sprintStatus: string | null;
}

export type MyTasksTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'blocked';

export interface MyTasksParams {
  tab: MyTasksTab;
  search?: string;
  projectId?: string;
  priority?: Priority;
}

export interface MyTasksResponse {
  items: TaskRow[];
  counts: Record<MyTasksTab, number>;
}

export interface TaskFormValues {
  projectId: string;
  type: TaskType;
  title: string;
  description: string;
  sprintId: string | null;
  assigneeId: string | null;
  reviewerId: string | null;
  priority: Priority;
  deadline: string | null;
  estimate: number | null;
  labels: string[];
}

export interface CancelPayload {
  reason: CancelReason;
  note: string;
}

export interface SearchResults {
  tasks: Pick<TaskRow, 'id' | 'key' | 'title' | 'status' | 'projectKey'>[];
  projects: { id: string; key: string; name: string }[];
  users: { id: string; fullName: string; username: string; position: string }[];
}
