import { queryClient } from '@/shared/lib/react-query';
import { useSessionStore } from '@/shared/lib/session';

import { logoutRequest } from '../api/authApi';

/** Auth store — the zustand session store plus auth actions. */
export const useAuthStore = useSessionStore;

/** Blacklists the refresh token on the backend (best effort) and clears the local session. */
export const logout = () => {
  const { refreshToken, clear } = useSessionStore.getState();
  if (refreshToken) void logoutRequest(refreshToken).catch(() => undefined);
  clear();
  queryClient.clear();
};
