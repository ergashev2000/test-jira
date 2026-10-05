import type { IconSvgElement } from '@hugeicons/react';
import { Analytics01Icon, Building02Icon, DashboardSquare01Icon, Folder01Icon, KanbanIcon, Notification03Icon, Rocket01Icon, Settings02Icon, Shield01Icon, Task01Icon, UserCircleIcon, UserGroupIcon, UserMultipleIcon, UserShield01Icon } from '@hugeicons/core-free-icons';
import { ROUTES, type Permission } from '@/shared/constants';

/** Navigation shared by the sidebar and the command palette. */
export interface NavItem {
  to: string;
  label: string;
  icon: IconSvgElement;
  permission?: Permission;
  /** Custom visibility check (in addition to permission). */
  show?: (role: string) => boolean;
}

export const WORK: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: DashboardSquare01Icon, permission: 'dashboard.view' },
  { to: ROUTES.MY_TASKS, label: 'My tasks', icon: Task01Icon },
  { to: ROUTES.NOTIFICATIONS, label: 'Inbox', icon: Notification03Icon },
];

export const WORKSPACE: NavItem[] = [
  { to: ROUTES.PROJECTS, label: 'Projects', icon: Folder01Icon, permission: 'project.view' },
  { to: ROUTES.SPRINTS, label: 'Sprints', icon: Rocket01Icon, permission: 'sprint.view' },
  { to: ROUTES.BOARD, label: 'Board', icon: KanbanIcon, permission: 'board.view' },
  { to: ROUTES.REPORTS, label: 'Reports', icon: Analytics01Icon, permission: 'report.view' },
];

export const ADMIN: NavItem[] = [
  { to: ROUTES.USERS, label: 'Users', icon: UserMultipleIcon, permission: 'user.manage' },
  { to: ROUTES.ROLES, label: 'Roles', icon: UserShield01Icon, permission: 'user.manage' },
  { to: ROUTES.TEAMS, label: 'Teams', icon: UserGroupIcon, permission: 'team.manage' },
  { to: ROUTES.BRANCHES, label: 'Branches', icon: Building02Icon, permission: 'settings.manage' },
  { to: ROUTES.AUDIT_LOG, label: 'Audit log', icon: Shield01Icon, permission: 'auditLog.view' },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings02Icon, permission: 'settings.manage' },
];

/** Pages reachable only from the user menu — still searchable. */
export const ACCOUNT: NavItem[] = [
  { to: ROUTES.PROFILE, label: 'Profile', icon: UserCircleIcon },
  { to: ROUTES.NOTIFICATION_SETTINGS, label: 'Notification settings', icon: Notification03Icon },
];
