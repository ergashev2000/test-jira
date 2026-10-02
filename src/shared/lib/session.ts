import { create } from 'zustand';

import type { User } from '@/shared/types';

import { bindActor, setSessionFromToken, TOKEN_PREFIX } from './mock/session';

const TOKEN_KEY = 'pm.token';
const REFRESH_KEY = 'pm.refresh';
const USER_KEY = 'pm.user';
const KEYS = [TOKEN_KEY, REFRESH_KEY, USER_KEY];

interface SessionState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (token: string, user: User, remember?: boolean, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

/** Backend (JWT) sessions have no GET /me yet, so the user is persisted next to the token. */
const isBackendToken = (token: string | null) => !!token && !token.startsWith(TOKEN_PREFIX);

/** Reads from whichever storage holds the token (sessionStorage, or localStorage with "Remember me"). */
const readStored = () => {
  try {
    const store = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
    const token = store.getItem(TOKEN_KEY);
    const rawUser = isBackendToken(token) ? store.getItem(USER_KEY) : null;
    return { token, refreshToken: store.getItem(REFRESH_KEY), user: rawUser ? (JSON.parse(rawUser) as User) : null };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
};

/** Points the mock API at the session user (mock token → seeded user, backend token → bridged user). */
const syncMockActor = (token: string | null, user: User | null) => {
  if (isBackendToken(token) && user) bindActor(user);
  else setSessionFromToken(token);
};

const initial = readStored();
syncMockActor(initial.token, initial.user);

/**
 * Session store (zustand, no persist middleware). Mock sessions keep only the token and
 * re-fetch the user; backend sessions also keep the refresh token and the user.
 */
export const useSessionStore = create<SessionState>((set, get) => ({
  token: initial.token,
  refreshToken: initial.refreshToken,
  user: initial.user,
  setSession: (token, user, remember = false, refreshToken = null) => {
    try {
      KEYS.forEach((k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
      const store = remember ? localStorage : sessionStorage;
      store.setItem(TOKEN_KEY, token);
      if (refreshToken) store.setItem(REFRESH_KEY, refreshToken);
      if (isBackendToken(token)) store.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
    syncMockActor(token, user);
    set({ token, refreshToken, user });
  },
  setUser: (user) => {
    const { token } = get();
    if (isBackendToken(token)) {
      try {
        (sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage).setItem(USER_KEY, JSON.stringify(user));
      } catch {
        /* storage unavailable */
      }
      bindActor(user);
    }
    set({ user });
  },
  clear: () => {
    try {
      KEYS.forEach((k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    } catch {
      /* storage unavailable */
    }
    setSessionFromToken(null);
    set({ token: null, refreshToken: null, user: null });
  },
}));

/** Non-null current user — only use inside protected routes. */
export const useCurrentUser = () => {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser used outside of an authenticated route');
  return user;
};
