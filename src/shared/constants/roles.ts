import type { Role } from '@/shared/types';

export const ROLES: Record<Role, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'magenta' },
  ADMIN: { label: 'Admin', color: 'volcano' },
  PROJECT_MANAGER: { label: 'Project Manager', color: 'geekblue' },
  TEAM_LEAD: { label: 'Team Lead', color: 'cyan' },
  EMPLOYEE: { label: 'Employee', color: 'default' },
};

export const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((r) => ({ value: r, label: ROLES[r].label }));

/** Roles that direct work: can approve, cancel immediately, manage blockers of anyone. */
export const MANAGER_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD'];
export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN'];
