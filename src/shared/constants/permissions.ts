import type { Role } from '@/shared/types';

import { primaryRole } from './roles';

export const PERMISSIONS = [
  'dashboard.view',
  'project.view',
  'project.create',
  'project.edit',
  'project.archive',
  'project.members.manage',
  'sprint.view',
  'sprint.manage',
  'board.view',
  'task.create',
  'task.assign',
  'task.edit',
  'task.changeStatus',
  'task.review.approve',
  'task.cancel',
  'task.block',
  'comment.create',
  'attachment.add',
  'user.manage',
  'team.manage',
  'branches.view',
  'branches.manage',
  'positions.view',
  'positions.manage',
  'report.view',
  'report.daily.all',
  'report.teamDaily',
  'report.sprint',
  'report.project',
  'auditLog.view',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MANAGER_TASK: Permission[] = [
  'task.create',
  'task.assign',
  'task.edit',
  'task.changeStatus',
  'task.review.approve',
  'task.cancel',
  'task.block',
];

const BASE: Permission[] = [
  'project.view',
  'sprint.view',
  'board.view',
  'comment.create',
  'attachment.add',
  'report.view',
];

/**
 * Role → permission map. These are *capabilities*; contextual rules
 * (own task, reviewer, project membership) live in `shared/utils/taskRules.ts`.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((p) => p !== 'settings.manage'),
  PROJECT_MANAGER: [
    ...BASE,
    ...MANAGER_TASK,
    'dashboard.view',
    'project.edit',
    'project.members.manage',
    'sprint.manage',
    'report.daily.all',
    'report.teamDaily',
    'report.sprint',
    'report.project',
  ],
  TEAM_LEAD: [...BASE, ...MANAGER_TASK, 'dashboard.view', 'report.teamDaily'],
  EMPLOYEE: BASE,
};

/** Who is asking: GET /auth/me/ (or any object carrying its roles / permissions). */
export type PermissionSubject = { roles: string[]; permissions?: string[]; is_superuser?: boolean };

const ALWAYS = () => true;

/**
 * UI permission → backend permission codes (`Me.permissions`, see backend `accounts/rbac.py`).
 * Capabilities every signed-in user has are `ALWAYS`; the backend still checks each request.
 */
const FROM_BACKEND: Record<Permission, (codes: Set<string>) => boolean> = {
  'dashboard.view': (c) => c.has('dashboard.view'),
  'project.view': ALWAYS,
  'project.create': (c) => c.has('projects.create'),
  'project.edit': (c) => c.has('projects.edit'),
  'project.archive': (c) => c.has('projects.archive'),
  'project.members.manage': (c) => c.has('projects.manage'),
  'sprint.view': ALWAYS,
  'sprint.manage': (c) => c.has('sprints.manage'),
  'board.view': ALWAYS,
  'task.create': (c) => c.has('tasks.create'),
  'task.assign': (c) => c.has('tasks.assign'),
  'task.edit': (c) => c.has('tasks.manage'),
  'task.changeStatus': (c) => c.has('tasks.manage'),
  'task.review.approve': (c) => c.has('tasks.manage'),
  'task.cancel': (c) => c.has('tasks.cancel_approve'),
  'task.block': (c) => c.has('tasks.manage'),
  'comment.create': ALWAYS,
  'attachment.add': ALWAYS,
  'user.manage': (c) => c.has('users.manage'),
  'team.manage': (c) => c.has('teams.manage'),
  'branches.view': (c) => c.has('branches.view'),
  'branches.manage': (c) => c.has('branches.manage'),
  'positions.view': (c) => c.has('positions.view'),
  'positions.manage': (c) => c.has('positions.manage'),
  'report.view': ALWAYS,
  'report.daily.all': (c) => c.has('reports.view_all'),
  'report.teamDaily': (c) => c.has('reports.view_team') || c.has('reports.view_all'),
  'report.sprint': (c) => c.has('reports.view_all') || c.has('sprints.manage'),
  'report.project': (c) => c.has('reports.view_all') || c.has('projects.manage'),
  'auditLog.view': (c) => c.has('audit.view'),
  'settings.manage': (c) => c.has('settings.manage'),
};

/**
 * Driven by `Me.permissions` (works for Django superusers and custom roles too);
 * the role table above is only the fallback when the backend sent no permission list.
 */
export const hasPermission = (subject: PermissionSubject | null | undefined, permission: Permission): boolean => {
  if (!subject) return false;
  if (subject.is_superuser) return true;
  const codes = subject.permissions;
  if (codes?.length) {
    const set = new Set(codes);
    // The demo server sends UI codes as-is.
    return set.has(permission) || FROM_BACKEND[permission](set);
  }
  return ROLE_PERMISSIONS[primaryRole(subject.roles)].includes(permission);
};
