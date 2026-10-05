import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Role } from '@/shared/types';

import type { TeamBrief, User, UserCreate, UserListParams, UserRoles, UserUpdate } from '../types/user.types';

// GET /users/
export const listUsers = async (params: UserListParams = {}) => {
  const { data } = await api.get<ApiPaginated<User>>('/users/', { params });
  return data;
};

// GET /users/:id/  — fresh copy before editing
export const getUser = async (id: number) => {
  const { data } = await api.get<User>(`/users/${id}/`);
  return data;
};

// POST /users/
export const createUser = async (body: UserCreate) => {
  const { data } = await api.post<User>('/users/', body);
  return data;
};

// PATCH /users/:id/
export const updateUser = async (id: number, body: UserUpdate) => {
  const { data } = await api.patch<User>(`/users/${id}/`, body);
  return data;
};

// POST /users/:id/roles/  — replaces the full list
export const setUserRoles = async (id: number, roles: Role[]) => {
  const { data } = await api.post<UserRoles>(`/users/${id}/roles/`, { roles });
  return data;
};

// POST /users/:id/activate/ | /users/:id/deactivate/  — no delete: history must be kept
export const setUserActive = async (id: number, active: boolean) => {
  const { data } = await api.post<User>(`/users/${id}/${active ? 'activate' : 'deactivate'}/`);
  return data;
};

// GET /teams/  — for the team filter / select
export const listTeams = async () => {
  const { data } = await api.get<ApiPaginated<TeamBrief>>('/teams/', { params: { page_size: 100 } });
  return data;
};
