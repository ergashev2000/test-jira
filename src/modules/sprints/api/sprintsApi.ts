import { fetchSprints, type SprintQuery } from '@/shared/api/sprints';
import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Sprint, SprintReport, SprintWrite, Task } from '@/shared/types';

export type { Sprint, SprintWrite } from '@/shared/types';

export type SprintListParams = SprintQuery;

// GET /sprints/?status=&ordering=  |  /projects/:id/sprints/?status=&search=&ordering=  (see fetchSprints)
export const listSprints = (params: SprintListParams = {}) => fetchSprints(params);

// GET /sprints/:id/
export const getSprint = async (id: number) => {
  const { data } = await api.get<Sprint>(`/sprints/${id}/`);
  return data;
};

// POST /sprints/
export const createSprint = async (body: SprintWrite) => {
  const { data } = await api.post<Sprint>('/sprints/', body);
  return data;
};

// PATCH /sprints/:id/
export const updateSprint = async (id: number, body: Partial<SprintWrite>) => {
  const { data } = await api.patch<Sprint>(`/sprints/${id}/`, body);
  return data;
};

// POST /sprints/:id/start/
export const startSprint = async (id: number) => {
  const { data } = await api.post<Sprint>(`/sprints/${id}/start/`);
  return data;
};

// POST /sprints/:id/cancel/  — unfinished tasks go back to the backlog
export const cancelSprint = async (id: number) => {
  const { data } = await api.post<Sprint>(`/sprints/${id}/cancel/`);
  return data;
};

// POST /sprints/:id/complete/  { move_to: 'backlog' | <planned sprint id> }  — body NOT IN api.json yet
export const completeSprint = async (id: number, moveTo: 'backlog' | number) => {
  const { data } = await api.post<Sprint>(`/sprints/${id}/complete/`, { move_to: moveTo });
  return data;
};

// GET /projects/{id}/backlog/  — tasks with no sprint (not done / cancelled), critical first, then earlier deadlines
export const listProjectBacklog = async (projectId: number, params: { page_size?: number } = {}) => {
  const { data } = await api.get<ApiPaginated<Task>>(`/projects/${projectId}/backlog/`, { params });
  return data;
};

// POST /tasks/:id/move-sprint/  { sprint }
export const moveTaskToSprint = async (taskId: number, sprint: number) => {
  await api.post(`/tasks/${taskId}/move-sprint/`, { sprint });
};

// GET /reports/sprints/:id/  — live preview for an active sprint, snapshot once completed
export const getSprintReport = async (id: number) => {
  const { data } = await api.get<SprintReport>(`/reports/sprints/${id}/`);
  return data;
};

// GET /tasks/?sprint=&status=backlog,todo,in_progress,review  — what "Complete sprint" will move
export const listUnfinishedTasks = async (sprint: number) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', {
    params: { sprint, status: ['backlog', 'todo', 'in_progress', 'review'], page_size: 100, ordering: 'key' },
  });
  return data;
};
