import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Project, Role, Sprint, SprintStatus, Team, TeamBrief, UserBrief } from '@/shared/types';

/** Page size for reference lists rendered in full (selects, sidebar). */
export const LOOKUP_PAGE_SIZE = 100;

export interface UserOptionsParams {
  projectId?: number;
  teamId?: number;
  roles?: Role[];
  onlyActive?: boolean;
  search?: string;
}

/** Picker row: the brief plus team / roles when the endpoint returns them (GET /users/ does). */
export type UserOptionRow = UserBrief & { team?: TeamBrief | null; roles?: Role[] };

/**
 * Users for a picker, filtered and searched on the backend:
 * GET /projects/:id/members/ | /teams/:id/members/ | /users/?role=&status=active
 */
export const fetchUserOptions = async ({ projectId, teamId, roles, onlyActive, search }: UserOptionsParams) => {
  const url = projectId ? `/projects/${projectId}/members/` : teamId ? `/teams/${teamId}/members/` : '/users/';
  const base = { search: search || undefined, page_size: 50, status: onlyActive ? 'active' : undefined };
  const get = async (role?: Role) => {
    const { data } = await api.get<ApiPaginated<UserOptionRow>>(url, { params: { ...base, role } });
    return data.results;
  };
  // `role` on /users/ is single-valued: one request per role, merged by id.
  if (projectId || teamId || !roles?.length) return get();
  const lists = await Promise.all(roles.map(get));
  return [...new Map(lists.flat().map((u) => [u.id, u])).values()];
};

export const useUserOptions = (params: UserOptionsParams) =>
  useQuery({
    queryKey: ['users', 'options', params],
    queryFn: () => fetchUserOptions(params),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

// GET /projects/  — projects visible to the current user
export const fetchProjectLookups = async () => {
  const { data } = await api.get<ApiPaginated<Project>>('/projects/', { params: { page_size: LOOKUP_PAGE_SIZE, ordering: 'name' } });
  return data.results;
};

// GET /sprints/?project=&status=
export const fetchSprintLookups = async (params: { project?: number; status?: SprintStatus[] }) => {
  const { data } = await api.get<ApiPaginated<Sprint>>('/sprints/', {
    params: { ...params, page_size: LOOKUP_PAGE_SIZE, ordering: '-start_date' },
  });
  return data.results;
};

export const useSprintLookups = (project?: number, status?: SprintStatus[]) =>
  useQuery({
    queryKey: ['sprints', 'lookup', project ?? 'all', status ?? 'any'],
    queryFn: () => fetchSprintLookups({ project, status }),
    enabled: !!project,
  });

/** Sprints a task may be put into: active / planned only (never completed). */
export const useOpenSprints = (project?: number) => useSprintLookups(project, ['active', 'planned']);

// GET /teams/
export const fetchTeamLookups = async () => {
  const { data } = await api.get<ApiPaginated<Team>>('/teams/', { params: { page_size: LOOKUP_PAGE_SIZE, ordering: 'name' } });
  return data.results;
};

export const useTeamLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.teams.lookups, queryFn: fetchTeamLookups, staleTime: 30_000 });

export const useProjectLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.projects.options, queryFn: fetchProjectLookups, staleTime: 30_000 });
