import { useQuery } from '@tanstack/react-query';
import { Button, Result } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate, useRouteError } from 'react-router-dom';

import { fetchMe, logout, useAuthStore } from '@/modules/auth';
import { PageLoader } from '@/shared/components/ui/Loader';
import { hasPermission, QUERY_KEYS, ROUTES, type Permission } from '@/shared/constants';
import { ApiError } from '@/shared/lib/apiError';
import { isSignedIn } from '@/shared/lib/session';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useAuthStore();
  const signedIn = useAuthStore(isSignedIn);
  const location = useLocation();

  const me = useQuery({ queryKey: QUERY_KEYS.me, queryFn: fetchMe, enabled: signedIn, retry: false });

  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);

  useEffect(() => {
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

export const RoleGuard = ({ permission, children }: { permission: Permission; children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  return hasPermission(user, permission) ? <>{children}</> : <Forbidden />;
};

export const HomeRedirect = () => {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={hasPermission(user, 'dashboard.view') ? ROUTES.DASHBOARD : ROUTES.MY_TASKS} replace />;
};

export const DashboardGuard = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  return hasPermission(user, 'dashboard.view') ? <>{children}</> : <Navigate to={ROUTES.MY_TASKS} replace />;
};

const CHUNK_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;
const RELOAD_KEY = 'chunk-reload';

/** Reload at most once per 10s so a genuinely missing chunk can't loop. */
const canAutoReload = () => Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) > 10_000;

/** Route error screen. A failed lazy chunk (stale tab after deploy) triggers one hard reload. */
export const RouteError = () => {
  const error = useRouteError();
  const isChunkError = error instanceof Error && CHUNK_ERROR.test(error.message);
  const [shouldReload] = useState(() => isChunkError && canAutoReload());

  useEffect(() => {
    if (!shouldReload) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }, [shouldReload]);

  if (shouldReload) return <PageLoader />;
  return (
    <Result status="error" title="Something went wrong"
      subTitle={isChunkError ? 'A new version is available. Please reload the page.' : 'An unexpected error occurred.'}
      extra={<Button type="primary" onClick={() => window.location.reload()}>Reload</Button>} />
  );
};
