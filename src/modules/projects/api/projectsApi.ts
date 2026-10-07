import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Project, ProjectMember, ProjectOverview, ProjectWrite } from '@/shared/types';

import type { ProjectListParams } from '../types/project.types';

export const listProjects = async (params: ProjectListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Project>>('/projects/', { params });
  return data;
};

// GET /projects/{id}/
export const getProject = async (id: number | string) => {
  const { data } = await api.get<Project>(`/projects/${id}/`);
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

// GET /projects/{id}/overview/  — the Overview tab in one request (about, tasks by status, active sprint, top blockers)
export const getProjectOverview = async (id: number) => {
  const { data } = await api.get<ProjectOverview>(`/projects/${id}/overview/`);
  return data;
};

// GET /projects/:id/members/
export const listMembers = async (id: number) => {
  const { data } = await api.get<ProjectMember[]>(`/projects/${id}/members/`);
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
