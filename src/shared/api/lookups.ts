import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import { api } from '@/shared/lib/axios';
import { asList } from '@/shared/lib/normalize';
import type { ApiPaginated, Project, Role, SprintStatus, Team, TeamBrief, UserBrief } from '@/shared/types';

import { fetchSprints } from './sprints';

export const LOOKUP_PAGE_SIZE = 100;

export interface UserOptionsParams {
  projectId?: number;
  teamId?: number;
  roles?: Role[];
  onlyActive?: boolean;
  search?: string;
}

export type UserOptionRow = UserBrief & { team?: TeamBrief | null; roles?: Role[] };

export const fetchUserOptions = async ({ projectId, teamId, roles, onlyActive, search }: UserOptionsParams) => {
  const url = projectId ? `/projects/${projectId}/members/` : teamId ? `/teams/${teamId}/members/` : '/users/';
  const base = { search: search || undefined, page_size: 50, status: onlyActive ? 'active' : undefined };
  const get = async (role?: Role) => {
    const { data } = await api.get<UserOptionRow[] | ApiPaginated<UserOptionRow>>(url, { params: { ...base, role } });
    return asList(data);
  };
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

export const fetchProjectLookups = async () => {
  const { data } = await api.get<ApiPaginated<Project>>('/projects/', { params: { page_size: LOOKUP_PAGE_SIZE, ordering: 'name' } });
  return data.results;
};

export const fetchSprintLookups = async (params: { project?: number; status?: SprintStatus[] }) => {
  const data = await fetchSprints({ ...params, page_size: LOOKUP_PAGE_SIZE, ordering: '-start_date' });
  return data.results;
};

export const useSprintLookups = (project?: number, status?: SprintStatus[]) =>
  useQuery({
    queryKey: ['sprints', 'lookup', project ?? 'all', status ?? 'any'],
    queryFn: () => fetchSprintLookups({ project, status }),
    enabled: !!project,
  });

export const useOpenSprints = (project?: number) => useSprintLookups(project, ['active', 'planned']);

export const fetchTeamLookups = async () => {
  const { data } = await api.get<ApiPaginated<Team>>('/teams/', { params: { page_size: LOOKUP_PAGE_SIZE, ordering: 'name' } });
  return data.results;
};

export const useTeamLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.teams.lookups, queryFn: fetchTeamLookups, staleTime: 30_000 });

export const useProjectLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.projects.options, queryFn: fetchProjectLookups, staleTime: 30_000 });
