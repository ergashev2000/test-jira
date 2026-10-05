import Cookies from 'js-cookie';
import { create } from 'zustand';

import { primaryRole } from '@/shared/constants/roles';
import type { Me, Role } from '@/shared/types';

const ACCESS_COOKIE = 'pm.access';
const REFRESH_COOKIE = 'pm.refresh';
const USER_KEY = 'pm.user';

interface SessionState {
  token: string | null;
  refreshToken: string | null;
  user: Me | null;
  setSession: (token: string, refreshToken: string, user: Me) => void;
  /** Swaps tokens after a refresh (the backend may rotate the refresh token too). */
  setTokens: (token: string, refreshToken?: string | null) => void;
  setUser: (user: Me) => void;
  clear: () => void;
}

/** JWT `exp` (seconds) → Date, so a cookie never outlives its token. */
const jwtExpiry = (token: string): Date | undefined => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return payload.exp ? new Date(payload.exp * 1000) : undefined;
  } catch {
    return undefined;
  }
};

const setTokenCookie = (name: string, token: string) =>
  Cookies.set(name, token, {
    expires: jwtExpiry(token),
    path: '/',
    sameSite: 'strict',
    secure: window.location.protocol === 'https:',
  });

const readUser = (): Me | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? (JSON.parse(raw) as Me) : null;
    // Ignore a profile saved in an older shape — GET /auth/me/ refills it.
    return user && Array.isArray(user.roles) ? user : null;
  } catch {
    return null;
  }
};

const writeUser = (user: Me | null) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
};

/**
 * The access cookie expires with the access token (~30 min); the session lives as long as the
 * refresh token, and the axios interceptor issues a new access token on the next 401.
 */
const initial = {
  token: Cookies.get(ACCESS_COOKIE) ?? null,
  refreshToken: Cookies.get(REFRESH_COOKIE) ?? null,
  user: readUser(),
};
const signedIn = !!(initial.token || initial.refreshToken);
if (!signedIn) writeUser(null);

/** Highest of the user's backend roles — drives menus and permission checks. */
export const roleOf = (user: Pick<Me, 'roles'> | null | undefined): Role | undefined =>
  user ? primaryRole(user.roles) : undefined;

/** Signed in while either token is alive — an expired access token is renewed with the refresh token. */
export const isSignedIn = (s: Pick<SessionState, 'token' | 'refreshToken'>) => !!(s.token || s.refreshToken);

/** Session store: JWT tokens in cookies (js-cookie), the user (GET /auth/me/ as-is) in localStorage. */
export const useSessionStore = create<SessionState>((set) => ({
  token: signedIn ? initial.token : null,
  refreshToken: initial.refreshToken,
  user: signedIn ? initial.user : null,
  setSession: (token, refreshToken, user) => {
    setTokenCookie(ACCESS_COOKIE, token);
    setTokenCookie(REFRESH_COOKIE, refreshToken);
    writeUser(user);
    set({ token, refreshToken, user });
  },
  setTokens: (token, refreshToken) => {
    setTokenCookie(ACCESS_COOKIE, token);
    if (refreshToken) setTokenCookie(REFRESH_COOKIE, refreshToken);
    set((s) => ({ token, refreshToken: refreshToken ?? s.refreshToken }));
  },
  setUser: (user) => {
    writeUser(user);
    set({ user });
  },
  clear: () => {
    Cookies.remove(ACCESS_COOKIE, { path: '/' });
    Cookies.remove(REFRESH_COOKIE, { path: '/' });
    writeUser(null);
    set({ token: null, refreshToken: null, user: null });
  },
}));

/** Non-null current user — only use inside protected routes. */
export const useCurrentUser = () => {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser used outside of an authenticated route');
  return user;
};
