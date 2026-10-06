import { api } from '@/shared/lib/axios';
import { asPage } from '@/shared/lib/normalize';
import type { ApiPaginated, Role } from '@/shared/types';

import type { MemberAdd, Team, TeamListParams, TeamMember, TeamWrite } from '../types/team.types';

// GET /teams/
export const listTeams = async (params: TeamListParams = {}) => {
  const { data } = await api.get<ApiPaginated<Team>>('/teams/', { params });
  return data;
};

// GET /teams/:id/  — fresh copy before editing
export const getTeam = async (id: number) => {
  const { data } = await api.get<Team>(`/teams/${id}/`);
  return data;
};

// POST /teams/
export const createTeam = async (body: TeamWrite) => {
  const { data } = await api.post<Team>('/teams/', body);
  return data;
};

// PATCH /teams/:id/
export const updateTeam = async (id: number, body: Partial<TeamWrite>) => {
  const { data } = await api.patch<Team>(`/teams/${id}/`, body);
  return data;
};

// GET /teams/:id/members/  — a plain array today
export const listTeamMembers = async (id: number) => {
  const { data } = await api.get<TeamMember[] | ApiPaginated<TeamMember>>(`/teams/${id}/members/`, { params: { page_size: 100 } });
  return asPage(data);
};

// POST /teams/:id/members/  — moves the user out of their current team
export const addTeamMember = async (id: number, body: MemberAdd) => {
  const { data } = await api.post<TeamMember>(`/teams/${id}/members/`, body);
  return data;
};

// DELETE /teams/:id/members/:user_id/
export const removeTeamMember = async (id: number, userId: number) => {
  await api.delete(`/teams/${id}/members/${userId}/`);
};

// GET /users/?search=  — options for lead / member selects
export const searchUsers = async (search: string, role?: Role) => {
  const { data } = await api.get<ApiPaginated<TeamMember>>('/users/', { params: { search: search || undefined, role, page_size: 20, status: 'active' } });
  return data;
};
