import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuditLogPage } from '@/modules/audit-log';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/modules/auth';
import { GlobalBoardPage, ProjectBoardTab } from '@/modules/board';
import { DashboardPage } from '@/modules/dashboard';
import { NotificationSettingsPage, NotificationsPage } from '@/modules/notifications';
import { ProfilePage } from '@/modules/profile';
import { ProjectActivityTab, ProjectLayout, ProjectMembersTab, ProjectOverviewTab, ProjectsPage } from '@/modules/projects';
import { ProjectReportsTab, ReportsPage } from '@/modules/reports';
import { SettingsPage } from '@/modules/settings';
import { BacklogTab, ProjectSprintsTab, SprintsPage } from '@/modules/sprints';
import { MyTasksPage, TaskPage } from '@/modules/tasks';
import { TeamsPage } from '@/modules/teams';
import { UsersPage } from '@/modules/users';
import { MainLayout } from './MainLayout';
import type { Permission } from '@/shared/constants';

import { DashboardGuard, Forbidden, HomeRedirect, NotFound, ProtectedRoute, RoleGuard } from './guards';

const guard = (permission: Permission, element: React.ReactNode) => <RoleGuard permission={permission}>{element}</RoleGuard>;

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'dashboard', element: <DashboardGuard><DashboardPage /></DashboardGuard> },
      { path: 'my-tasks', element: <MyTasksPage /> },
      { path: 'projects', element: guard('project.view', <ProjectsPage />) },
      {
        path: 'projects/:projectKey',
        element: guard('project.view', <ProjectLayout />),
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <ProjectOverviewTab /> },
          { path: 'board', element: <ProjectBoardTab /> },
          { path: 'backlog', element: <BacklogTab /> },
          { path: 'sprints', element: <ProjectSprintsTab /> },
          { path: 'members', element: <ProjectMembersTab /> },
          { path: 'reports', element: <ProjectReportsTab /> },
          { path: 'activity', element: <ProjectActivityTab /> },
        ],
      },
      { path: 'sprints', element: guard('sprint.view', <SprintsPage />) },
      { path: 'board', element: guard('board.view', <GlobalBoardPage />) },
      { path: 'tasks/:taskKey', element: <TaskPage /> },
      { path: 'users', element: guard('user.manage', <UsersPage />) },
      { path: 'teams', element: guard('team.manage', <TeamsPage />) },
      { path: 'reports', element: guard('report.view', <ReportsPage />) },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'notifications/settings', element: <NotificationSettingsPage /> },
      { path: 'audit-log', element: guard('auditLog.view', <AuditLogPage />) },
      { path: 'settings', element: guard('settings.manage', <SettingsPage />) },
      { path: 'profile', element: <ProfilePage /> },
      { path: '403', element: <Forbidden /> },
      { path: '*', element: <NotFound /> },
    ],
  },
], {
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
});
