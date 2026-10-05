import { api } from '@/shared/lib/axios';
import type { ApiPaginated, ListParams, Project, ProjectMember, ProjectReport, ProjectWrite, Task } from '@/shared/types';

import type { ProjectListParams } from '../types/project.types';

// GET /projects/?search=&status=&manager=&member=&ordering=
export const listProjects = async (params: ProjectListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Project>>('/projects/', { params });
  return data;
};

// GET /projects/:key/  — routes use the project key
export const getProject = async (key: string) => {
  const { data } = await api.get<Project>(`/projects/${key}/`);
  return data;
};

// POST /projects/
export const createProject = async (body: ProjectWrite) => {
  const { data } = await api.post<Project>('/projects/', body);
  return data;
};

// PATCH /projects/:id/  — key is immutable
export const updateProject = async (id: number, body: Partial<ProjectWrite>) => {
  const { data } = await api.patch<Project>(`/projects/${id}/`, body);
  return data;
};

// PATCH /projects/:id/  { status: 'archived' }
export const archiveProject = (id: number) => updateProject(id, { status: 'archived' });

// GET /reports/projects/:id/  — status counts, blocked / overdue for the overview tab
export const getProjectReport = async (id: number) => {
  const { data } = await api.get<ProjectReport>(`/reports/projects/${id}/`);
  return data;
};

// GET /tasks/?project=&is_blocked=true&ordering=updated_at  — oldest blockers first
export const listTopBlockers = async (project: number) => {
  const { data } = await api.get<ApiPaginated<Task>>('/tasks/', {
    params: { project, is_blocked: true, ordering: 'updated_at', page_size: 5 },
  });
  return data;
};

// GET /projects/:id/members/
export const listMembers = async (id: number, params: ListParams = {}) => {
  const { data } = await api.get<ApiPaginated<ProjectMember>>(`/projects/${id}/members/`, { params: { page_size: 100, ...params } });
  return data;
};

// POST /projects/:id/members/  { user_id, role_in_project }  — idempotent
export const addMember = async (id: number, userId: number, roleInProject?: string) => {
  await api.post(`/projects/${id}/members/`, { user_id: userId, role_in_project: roleInProject });
};

// DELETE /projects/:id/members/:user_id/
export const removeMember = async (id: number, userId: number) => {
  await api.delete(`/projects/${id}/members/${userId}/`);
};
