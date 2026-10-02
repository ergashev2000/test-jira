import type { Role } from '@/shared/types';

export const ROLES: Record<Role, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'magenta' },
  ADMIN: { label: 'Admin', color: 'volcano' },
  PROJECT_MANAGER: { label: 'Project Manager', color: 'geekblue' },
  TEAM_LEAD: { label: 'Team Lead', color: 'cyan' },
  EMPLOYEE: { label: 'Employee', color: 'default' },
};

/** Highest role wins when the backend returns several (ROLES is ordered by rank). */
export const primaryRole = (roles: string[]): Role =>
  (Object.keys(ROLES) as Role[]).find((r) => roles.some((x) => x.toUpperCase() === r)) ?? 'EMPLOYEE';

export const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((r) => ({ value: r, label: ROLES[r].label }));

/** Roles that direct work: can approve, cancel immediately, manage blockers of anyone. */
export const MANAGER_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'];
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];
