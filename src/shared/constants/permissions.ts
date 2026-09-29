import type { Role } from '@/shared/types';

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

export const hasPermission = (role: Role | undefined, permission: Permission): boolean =>
  !!role && ROLE_PERMISSIONS[role].includes(permission);
