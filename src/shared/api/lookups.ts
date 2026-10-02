import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/shared/constants';
import { actor, db, mockRequest, visibleProjects } from '@/shared/lib/mock';
import type { Project, Sprint, Team, User } from '@/shared/types';

/**
 * Lightweight reference data used by shared selects/avatars across modules.
 */
export type UserLookup = Pick<User, 'id' | 'fullName' | 'username' | 'role' | 'status' | 'position' | 'teamId'>;
export type ProjectLookup = Pick<Project, 'id' | 'key' | 'name' | 'status' | 'managerId' | 'memberIds'>;

// GET /api/lookups/users
export const fetchUserLookups = () =>
  mockRequest(() => {
    actor();
    return db.users.map<UserLookup>(({ id, fullName, username, role, status, position, teamId }) => ({
      id, fullName, username, role, status, position, teamId,
    }));
  }, 200);

// GET /api/lookups/projects  (only projects visible to current user)
export const fetchProjectLookups = () =>
  mockRequest(
    () =>
      visibleProjects(actor()).map<ProjectLookup>(({ id, key, name, status, managerId, memberIds }) => ({
        id, key, name, status, managerId, memberIds,
      })),
    200,
  );

export type SprintLookup = Pick<Sprint, 'id' | 'name' | 'status' | 'projectId' | 'startDate' | 'endDate'>;

// GET /api/lookups/sprints?projectId=
export const fetchSprintLookups = (projectId?: string) =>
  mockRequest(() => {
    const visible = new Set(visibleProjects(actor()).map((p) => p.id));
    return db.sprints
      .filter((s) => visible.has(s.projectId) && (!projectId || s.projectId === projectId))
      .map<SprintLookup>(({ id, name, status, projectId: pid, startDate, endDate }) => ({
        id, name, status, projectId: pid, startDate, endDate,
      }));
  }, 200);

/** Sprints a task may be put into: ACTIVE / PLANNED only (never COMPLETED). */
export const useOpenSprints = (projectId?: string) =>
  useQuery({
    queryKey: ['sprints', 'lookup', projectId ?? 'all'],
    queryFn: () => fetchSprintLookups(projectId),
    enabled: !!projectId,
    select: (list) => list.filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNED'),
  });

// GET /api/lookups/teams  — mock; Reports/Profile still run on mock data.
export const fetchTeamLookups = () =>
  mockRequest(() => {
    actor();
    return db.teams as Team[];
  }, 200);

export const useTeamLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.teams.lookups, queryFn: fetchTeamLookups, staleTime: 30_000 });

export const useUserLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.users.options, queryFn: fetchUserLookups, staleTime: 60_000 });

export const useProjectLookups = () =>
  useQuery({ queryKey: QUERY_KEYS.projects.options, queryFn: fetchProjectLookups, staleTime: 30_000 });

export const useUserMap = () => {
  const { data } = useUserLookups();
  return new Map((data ?? []).map((u) => [u.id, u]));
};
