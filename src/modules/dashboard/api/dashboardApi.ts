import type { Activity, ApiPaginated, Task, UserBrief } from '@/shared/types';
import { api } from '@/shared/lib/axios';
import { asPage } from '@/shared/lib/normalize';

export interface DashboardKpi { active_projects: number; active_sprints: number; total_tasks: number; completed_today: number; overdue_tasks: number; blocked_tasks: number; }
export interface DashboardSprintProgress {
  sprint: { id: number; name: string; goal: string; start_date: string; end_date: string; days_left: number; project: { id: number; key: string; name: string } };
  total: number; completed: number; completion_percent: number; completed_percent: number; by_status: Record<string, number>;
  groups: { todo: number; in_progress: number; done: number }; blocked: number; overdue: number; cancelled: number;
}
export interface DashboardTeamRow { user: UserBrief; assigned: number; completed: number; unfinished: number; blocked: number; overdue: number; completion_percent: number; }
export interface DashboardWorkloadRow { user: UserBrief; active_tasks: number; blocked: number; }
export interface DashboardBlocker {
  id: number; task: { id: number; key: string; title: string; status: string; priority: string }; user: UserBrief | null; blocked_by: UserBrief | null;
  project: { id: number; key: string }; reason: string; blocked_since: string; hours: number; is_stale: boolean;
}
export type DashboardActivity = Activity & { project: { id: number; key: string } };

const projectParams = (project?: number) => ({ project });
export const getDashboardKpi = async (project?: number) => (await api.get<DashboardKpi>('/dashboard/kpi/', { params: projectParams(project) })).data;
export const getSprintProgress = async (project?: number) => (await api.get<DashboardSprintProgress[]>('/dashboard/sprint-progress/', { params: projectParams(project) })).data;
export const getDashboardTeam = async (project?: number) => (await api.get<DashboardTeamRow[]>('/dashboard/team/', { params: projectParams(project) })).data;
export const getDashboardWorkload = async (project?: number) => (await api.get<DashboardWorkloadRow[]>('/dashboard/workload/', { params: projectParams(project) })).data;
export const getDashboardBlockers = async (project?: number) => (await api.get<DashboardBlocker[]>('/dashboard/blockers/', { params: projectParams(project) })).data;

export const getDashboardOverdue = async (project?: number) => {
  const { data } = await api.get<Task[] | ApiPaginated<Task>>('/dashboard/overdue/', { params: { ...projectParams(project), page: 1, page_size: 10 } });
  return asPage(data);
};
export const getDashboardActivity = async (project?: number) => {
  const { data } = await api.get<DashboardActivity[] | ApiPaginated<DashboardActivity>>('/dashboard/activity/', { params: { ...projectParams(project), page: 1, page_size: 10 } });
  return asPage(data);
};
export const getMyTodayTasks = async () => (await api.get<ApiPaginated<Task>>('/me/tasks/', { params: { bucket: 'today', page: 1, page_size: 10 } })).data.results;
