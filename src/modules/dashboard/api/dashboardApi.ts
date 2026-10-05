import { api } from '@/shared/lib/axios';
import type { Activity, ApiPaginated, ProjectBrief, Task, UserBrief } from '@/shared/types';

/** GET /dashboard/?project= — NOT IN api.json; aggregates scoped to the caller's role on the backend. */
export interface DashboardSummary {
  kpi: { active_projects: number; active_sprints: number; total_tasks: number; completed_today: number; overdue: number; blocked: number };
  active_sprint: {
    id: number; name: string; goal: string; start_date: string; end_date: string;
    project: ProjectBrief; progress: number; days_left: number;
  } | null;
  sprint_progress: { completed: number; in_progress: number; todo: number; blocked: number };
  team: { user: UserBrief; assigned: number; completed: number; unfinished: number; blocked: number; overdue: number }[];
  workload: { user: UserBrief; active: number }[];
  activity: Activity[];
}

// GET /dashboard/?project=  — answered by the mock server until the backend ships it
export const getDashboard = async (project?: number) => {
  const { data } = await api.get<DashboardSummary>('/dashboard/', { params: { project } });
  return data;
};

// GET /me/tasks/?bucket=today&page_size=5
export const getMyTodayTasks = async () => {
  const { data } = await api.get<ApiPaginated<Task>>('/me/tasks/', { params: { bucket: 'today', page_size: 5, ordering: 'deadline' } });
  return data.results;
};

// GET /tasks/?is_blocked=true&project=&ordering=updated_at  — oldest blockers first
export const getBlockedTasks = async (project?: number) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', { params: { project, is_blocked: true, ordering: 'updated_at', page_size: 20 } });
  return data.results;
};

// GET /tasks/?deadline=overdue&project=&ordering=deadline
export const getOverdueTasks = async (project?: number) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', { params: { project, deadline: 'overdue', ordering: 'deadline', page_size: 8 } });
  return data.results;
};
