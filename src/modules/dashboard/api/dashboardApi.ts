import type { Activity, ProjectBrief, UserBrief } from '@/shared/types';

import { BLOCKERS_MOCK, DASHBOARD_MOCK, MY_TASKS_MOCK, OVERDUE_MOCK } from './dashboardMock';

/** Dashboard aggregates — the shape of the future GET /dashboard/?project=. */
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

// The dashboard shows demo data only (dashboardMock.ts) — no backend requests.
// When GET /dashboard/ ships, replace these bodies with the API calls.

export const getDashboard = async (project?: number): Promise<DashboardSummary> => {
  void project;
  return structuredClone(DASHBOARD_MOCK);
};

export const getMyTodayTasks = async () => structuredClone(MY_TASKS_MOCK);

export const getBlockedTasks = async (project?: number) => {
  void project;
  return structuredClone(BLOCKERS_MOCK);
};

export const getOverdueTasks = async (project?: number) => {
  void project;
  return structuredClone(OVERDUE_MOCK);
};
