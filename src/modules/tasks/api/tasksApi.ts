import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Board, DailyPlan, MyTasksSummary, Task, TaskStatus, TaskWrite } from '@/shared/types';

import type { BoardParams, MyTasksParams, TaskListParams } from '../types/task.types';

// GET /tasks/?project=&sprint=&status=&assignee=&priority=&is_blocked=&deadline=&search=&ordering=
export const listTasks = async (params: TaskListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', { params });
  return data;
};

// GET /projects/:id/board/?sprint=&assignee=&priority=&blocked=&deadline_to=&search=
export const getBoard = async (projectId: number, params: BoardParams = {}) => {
  const { data } = await api.get<Board>(`/projects/${projectId}/board/`, { params });
  return data;
};

// GET /me/tasks/?bucket=&project=&priority=&search=&ordering=
export const listMyTasks = async (params: MyTasksParams) => {
  const { data } = await api.get<ApiPaginated<Task>>('/me/tasks/', { params });
  return data;
};

// GET /me/tasks/summary/  — badge counts per bucket
export const getMyTasksSummary = async () => {
  const { data } = await api.get<MyTasksSummary>('/me/tasks/summary/');
  return data;
};

// GET /tasks/:key/
export const getTask = async (key: string) => {
  const { data } = await api.get<Task>(`/tasks/${key}/`);
  return data;
};

// POST /tasks/
export const createTask = async (body: TaskWrite) => {
  const { data } = await api.post<Task>('/tasks/', body);
  return data;
};

// PATCH /tasks/:id/
export const updateTask = async (id: number, body: Partial<TaskWrite>) => {
  const { data } = await api.patch<Task>(`/tasks/${id}/`, body);
  return data;
};

// POST /tasks/:id/assign/  { assignee_id }
export const assignTask = async (id: number, assigneeId: number | null) => {
  const { data } = await api.post<Task>(`/tasks/${id}/assign/`, { assignee_id: assigneeId });
  return data;
};

// POST /tasks/:id/move-sprint/  { sprint: id | null }  — null returns the task to the backlog
export const moveTask = async (id: number, sprint: number | null) => {
  const { data } = await api.post<Task>(`/tasks/${id}/move-sprint/`, { sprint });
  return data;
};

// POST /tasks/:id/transition/  { to }  — the backend may route "done" through review
export const transitionTask = async (id: number, to: TaskStatus) => {
  const { data } = await api.post<Task>(`/tasks/${id}/transition/`, { to });
  return data;
};

// GET /me/daily-plan/?date=  — built on first request of the day
export const getMyDailyPlan = async (date?: string) => {
  const { data } = await api.get<DailyPlan>('/me/daily-plan/', { params: { date } });
  return data;
};

// POST /me/daily-plan/confirm/?date=
export const confirmDailyPlan = async (date?: string) => {
  const { data } = await api.post<DailyPlan>('/me/daily-plan/confirm/', undefined, { params: { date } });
  return data;
};

// PATCH /me/daily-plan/  { note }  — end-of-day note
export const updateDailyPlanNote = async (note: string) => {
  const { data } = await api.patch<DailyPlan>('/me/daily-plan/', { note });
  return data;
};

// PATCH /me/daily-plan/tasks/:id/  { planned_status, note }
export const updateDailyPlanItem = async (id: number, body: { planned_status?: 'planned' | 'worked' | 'not_worked' | 'carried_over'; note?: string }) => {
  const { data } = await api.patch(`/me/daily-plan/tasks/${id}/`, body);
  return data;
};
