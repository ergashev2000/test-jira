import type { IconName } from '@/shared/components/ui/Icon';
import { ROUTES, type Permission } from '@/shared/constants';

/** Navigation shared by the sidebar and the command palette. */
export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  permission?: Permission;
  /** Custom visibility check (in addition to permission). */
  show?: (role: string) => boolean;
}

export const WORK: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'dashboard', permission: 'dashboard.view' },
  { to: ROUTES.MY_TASKS, label: 'My tasks', icon: 'task' },
  { to: ROUTES.NOTIFICATIONS, label: 'Inbox', icon: 'notification' },
];

export const WORKSPACE: NavItem[] = [
  { to: ROUTES.PROJECTS, label: 'Projects', icon: 'projects', permission: 'project.view' },
  { to: ROUTES.SPRINTS, label: 'Sprints', icon: 'sprint', permission: 'sprint.view' },
  { to: ROUTES.BOARD, label: 'Board', icon: 'board', permission: 'board.view' },
  { to: ROUTES.REPORTS, label: 'Reports', icon: 'analytics', permission: 'report.view' },
];

export const ADMIN: NavItem[] = [
  { to: ROUTES.USERS, label: 'Users', icon: 'users', permission: 'user.manage' },
  { to: ROUTES.TEAMS, label: 'Teams', icon: 'team', permission: 'team.manage' },
  { to: ROUTES.AUDIT_LOG, label: 'Audit log', icon: 'shield', permission: 'auditLog.view' },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: 'settings', permission: 'settings.manage' },
];

/** Pages reachable only from the user menu — still searchable. */
export const ACCOUNT: NavItem[] = [
  { to: ROUTES.PROFILE, label: 'Profile', icon: 'userCircle' },
  { to: ROUTES.NOTIFICATION_SETTINGS, label: 'Notification settings', icon: 'notification' },
];
