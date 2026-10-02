import { useQuery } from '@tanstack/react-query';
import { Button, Result } from 'antd';
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { fetchMe, logout, useAuthStore } from '@/modules/auth';
import { PageLoader } from '@/shared/components/ui/Loader';
import { hasPermission, QUERY_KEYS, ROUTES, type Permission } from '@/shared/constants';
import { ApiError } from '@/shared/lib/mock';
import { isSignedIn } from '@/shared/lib/session';

/** Requires a token; restores the user on reload via GET /auth/me. */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useAuthStore();
  const signedIn = useAuthStore(isSignedIn);
  const location = useLocation();
  // The persisted user renders at once; GET /auth/me/ refreshes it in the background
  // (an expired access token is renewed by the axios interceptor).
  const me = useQuery({ queryKey: QUERY_KEYS.me, queryFn: fetchMe, enabled: signedIn, retry: false });

  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  useEffect(() => {
    // Log out only when the session is really gone — a network error keeps the persisted user.
    const status = me.error instanceof ApiError ? me.error.status : null;
    if (me.isError && (!user || status === 401 || status === 403)) logout();
  }, [me.isError, me.error, user]);

  if (!signedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirect}`} replace />;
  }
  if (!user) return <PageLoader />;
  return <>{children}</>;
};

export const Forbidden = () => {
  const navigate = useNavigate();
  return (
    <Result status="403" title="403" subTitle="You don't have permission to view this page."
      extra={<Button type="primary" onClick={() => navigate(ROUTES.HOME)}>Go home</Button>} />
  );
};

export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Result status="404" title="404" subTitle="This page doesn't exist."
      extra={<Button type="primary" onClick={() => navigate(ROUTES.HOME)}>Go home</Button>} />
  );
};

/** Route-level permission check → 403 page. */
export const RoleGuard = ({ permission, children }: { permission: Permission; children: ReactNode }) => {
  const role = useAuthStore((s) => s.user?.role);
  return hasPermission(role, permission) ? <>{children}</> : <Forbidden />;
};

/** "/" → dashboard for leads/managers/admins, my-tasks for employees. */
export const HomeRedirect = () => {
  const role = useAuthStore((s) => s.user?.role);
  return <Navigate to={hasPermission(role, 'dashboard.view') ? ROUTES.DASHBOARD : ROUTES.MY_TASKS} replace />;
};

/** Employees opening /dashboard land on My Tasks instead of a 403. */
export const DashboardGuard = ({ children }: { children: ReactNode }) => {
  const role = useAuthStore((s) => s.user?.role);
  return hasPermission(role, 'dashboard.view') ? <>{children}</> : <Navigate to={ROUTES.MY_TASKS} replace />;
};
