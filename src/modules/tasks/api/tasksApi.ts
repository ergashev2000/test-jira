import { api } from '@/shared/lib/axios';
import { ApiError } from '@/shared/lib/apiError';
import type { ApiPaginated, Board, DailyPlan, MyTasksSummary, Task, TaskStatus, TaskWrite } from '@/shared/types';

import type { BoardParams, MyTasksParams, TaskListParams } from '../types/task.types';

// GET /tasks/?project=&sprint=&status=&assignee=&priority=&is_blocked=&deadline=&search=&ordering=
export const listTasks = async (params: TaskListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', { params });
  return data;
};

const listAllPages = async (url: string, params: TaskListParams = {}) => {
  // TODO: Replace eager loading with infinite scroll or Load more.
  const results: Task[] = [];
  let page = 1;
  let data: ApiPaginated<Task>;

  do {
    ({ data } = await api.get<ApiPaginated<Task>>(url, { params: { ...params, page, page_size: 100 } }));
    results.push(...data.results);
    page += 1;
  } while (data.next);

  return { ...data, next: null, previous: null, results };
};

/** Fetch every page for views that render a complete task section. */
export const listAllTasks = (params: TaskListParams = {}) => listAllPages('/tasks/', params);

/** GET /projects/:id/backlog/ — open tasks without a sprint. */
export const listProjectBacklog = (projectId: number) => listAllPages(`/projects/${projectId}/backlog/`);

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

// GET /tasks/{id}/
export const getTask = async (id: number | string) => {
  const { data } = await api.get<Task>(`/tasks/${id}/`);
  return data;
};

export const findTaskIdByKey = async (key: string) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', { params: { search: key, page_size: 100 } });
  return data.results.find((task) => task.key.toUpperCase() === key.toUpperCase())?.id;
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

const postTransition = async (id: number, to: TaskStatus) => {
  const { data } = await api.post<Task>(`/tasks/${id}/transition/`, { to });
  return data;
};

// POST /tasks/:id/transition/  { to }
// In a `require_review` project the backend rejects in_progress → done with 400 (it doesn't reroute
// to review itself yet), so "Done" falls back to sending `review` — what the workflow expects.
export const transitionTask = async (id: number, to: TaskStatus, from?: TaskStatus) => {
  try {
    return await postTransition(id, to);
  } catch (e) {
    if (to !== 'done' || from === 'review' || !(e instanceof ApiError) || e.status !== 400) throw e;
    return postTransition(id, 'review');
  }
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
