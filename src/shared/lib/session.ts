import { create } from 'zustand';

import type { User } from '@/shared/types';

import { setSessionFromToken } from './mock/session';

const TOKEN_KEY = 'pm.token';

interface SessionState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User, remember?: boolean) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const initialToken = readToken();
setSessionFromToken(initialToken);

/**
 * Session store (zustand, no persist middleware). Only the token survives reload
 * (sessionStorage, or localStorage with "Remember me"); the user is re-fetched.
 */
export const useSessionStore = create<SessionState>((set) => ({
  token: initialToken,
  user: null,
  setSession: (token, user, remember = false) => {
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
    setSessionFromToken(token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
    setSessionFromToken(null);
    set({ token: null, user: null });
  },
}));

/** Non-null current user — only use inside protected routes. */
export const useCurrentUser = () => {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser used outside of an authenticated route');
  return user;
};
