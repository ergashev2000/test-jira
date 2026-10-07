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
  setTokens: (token: string, refreshToken?: string | null) => void;
  setUser: (user: Me) => void;
  clear: () => void;
}

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

const initial = {
  token: Cookies.get(ACCESS_COOKIE) ?? null,
  refreshToken: Cookies.get(REFRESH_COOKIE) ?? null,
  user: readUser(),
};
const signedIn = !!(initial.token || initial.refreshToken);
if (!signedIn) writeUser(null);

export const roleOf = (user: Pick<Me, 'roles'> | null | undefined): Role | undefined =>
  user ? primaryRole(user.roles) : undefined;

export const isSignedIn = (s: Pick<SessionState, 'token' | 'refreshToken'>) => !!(s.token || s.refreshToken);

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

export const useCurrentUser = () => {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser used outside of an authenticated route');
  return user;
};
