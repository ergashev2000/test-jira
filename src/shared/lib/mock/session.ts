import { hasPermission, type Permission } from '@/shared/constants';
import type { Project, Task, User } from '@/shared/types';

import { db } from './mockDb';
import { ApiError } from './mockRequest';

/**
 * Mock "backend session": the token maps to a user id, exactly like a
 * backend would decode a JWT. API functions call `actor()` to authorise.
 */
let currentUserId: string | null = null;

export const TOKEN_PREFIX = 'mock-token.';

export const setSessionFromToken = (token: string | null) => {
  currentUserId = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
};

export const actor = (): User => {
  const user = db.users.find((u) => u.id === currentUserId);
  if (!user) throw new ApiError(401, 'Session expired. Please log in again.');
  if (user.status === 'INACTIVE') throw new ApiError(403, 'Your account is deactivated. Contact admin.');
  return user;
};

export const requirePermission = (p: Permission): User => {
  const a = actor();
  if (!hasPermission(a.role, p)) throw new ApiError(403, "You don't have permission for this action");
  return a;
};

const isAdmin = (u: User) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';

export const canSeeProject = (u: User, p: Project) =>
  isAdmin(u) || p.managerId === u.id || p.memberIds.includes(u.id);

export const visibleProjects = (u: User) => db.projects.filter((p) => canSeeProject(u, p));
export const visibleProjectIds = (u: User) => new Set(visibleProjects(u).map((p) => p.id));

export const assertProjectAccess = (u: User, projectId: string) => {
  const p = db.projects.find((x) => x.id === projectId);
  if (!p) throw new ApiError(404, 'Project not found');
  if (!canSeeProject(u, p)) throw new ApiError(403, "You don't have access to this project");
  return p;
};

export const findTask = (idOrKey: string): Task => {
  const t = db.tasks.find((x) => x.id === idOrKey || x.key === idOrKey);
  if (!t) throw new ApiError(404, 'Task not found');
  return t;
};

export const findUser = (id: string | null | undefined) => db.users.find((u) => u.id === id);

/**
 * Dashboard / report scope: which users' work the actor may observe.
 * Admin → all, PM → members of own projects, Team Lead → own team, Employee → self.
 */
export const scopeFilter = (u: User): ((t: Task) => boolean) => {
  if (isAdmin(u)) return () => true;
  const projectIds = visibleProjectIds(u);
  if (u.role === 'PROJECT_MANAGER') {
    const own = new Set(db.projects.filter((p) => p.managerId === u.id).map((p) => p.id));
    return (t) => own.has(t.projectId);
  }
  if (u.role === 'TEAM_LEAD') {
    const team = db.teams.find((t) => t.leadId === u.id);
    const members = new Set(team?.memberIds ?? [u.id]);
    return (t) => projectIds.has(t.projectId) && !!t.assigneeId && members.has(t.assigneeId);
  }
  return (t) => t.assigneeId === u.id;
};
