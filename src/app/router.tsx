import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/modules/auth';
import { NotificationSettingsPage, NotificationsPage } from '@/modules/notifications';
import { ProjectActivityTab, ProjectLayout, ProjectMembersTab, ProjectOverviewTab, ProjectsPage } from '@/modules/projects';
import { MyTasksPage } from '@/modules/tasks';
import { MainLayout } from '@/layouts';
import type { Permission } from '@/shared/constants';

import { DashboardGuard, Forbidden, HomeRedirect, NotFound, ProtectedRoute, RoleGuard, RouteError } from './guards';
import { lazyPage as page } from './lazyPage';

const guard = (permission: Permission, element: React.ReactNode) => <RoleGuard permission={permission}>{element}</RoleGuard>;

const boardPages = () => import('@/modules/board/pages/BoardPages');
const reportsPages = () => import('@/modules/reports/pages/ReportsPage');
const sprintsPages = () => import('@/modules/sprints/pages/SprintsPages');

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRedirect /> },
      // Lazy: pulls in recharts.
      { path: 'dashboard', element: <DashboardGuard>{page(() => import('@/modules/dashboard/pages/DashboardPage'), 'DashboardPage')}</DashboardGuard> },
      { path: 'my-tasks', element: <MyTasksPage /> },
      { path: 'projects', element: guard('project.view', <ProjectsPage />) },
      {
        path: 'projects/:projectId',
        element: guard('project.view', <ProjectLayout />),
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <ProjectOverviewTab /> },
          { path: 'board', element: page(boardPages, 'ProjectBoardTab') },
          { path: 'backlog', element: page(() => import('@/modules/sprints/pages/BacklogTab'), 'BacklogTab') },
          { path: 'sprints', element: page(sprintsPages, 'ProjectSprintsTab') },
          { path: 'members', element: <ProjectMembersTab /> },
          { path: 'reports', element: page(reportsPages, 'ProjectReportsTab') },
          { path: 'activity', element: <ProjectActivityTab /> },
        ],
      },
      { path: 'sprints', element: guard('sprint.view', page(sprintsPages, 'SprintsPage')) },
      { path: 'board', element: guard('board.view', page(boardPages, 'GlobalBoardPage')) },
      { path: 'tasks/:taskId', element: page(() => import('@/modules/tasks/pages/TaskPage'), 'TaskPage') },
      { path: 'users', element: guard('user.manage', page(() => import('@/modules/users/pages/UsersPage'), 'UsersPage')) },
      { path: 'roles', element: guard('user.manage', page(() => import('@/modules/roles/pages/RolesPage'), 'RolesPage')) },
      { path: 'teams', element: guard('team.manage', page(() => import('@/modules/teams/pages/TeamsPage'), 'TeamsPage')) },
      { path: 'branches', element: guard('settings.manage', page(() => import('@/modules/branches/pages/BranchesPage'), 'BranchesPage')) },
      { path: 'reports', element: guard('report.view', page(reportsPages, 'ReportsPage')) },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'notifications/settings', element: <NotificationSettingsPage /> },
      { path: 'audit-log', element: guard('auditLog.view', page(() => import('@/modules/audit-log/pages/AuditLogPage'), 'AuditLogPage')) },
      { path: 'settings', element: guard('settings.manage', page(() => import('@/modules/settings/pages/SettingsPage'), 'SettingsPage')) },
      { path: 'profile', element: page(() => import('@/modules/profile/pages/ProfilePage'), 'ProfilePage') },
      { path: '403', element: <Forbidden /> },
      { path: '*', element: <NotFound /> },
    ],
  },
], {
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
});
