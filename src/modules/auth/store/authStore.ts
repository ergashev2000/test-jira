import { queryClient } from '@/shared/lib/react-query';
import { useSessionStore } from '@/shared/lib/session';

/** Auth store — the zustand session store plus auth actions. */
export const useAuthStore = useSessionStore;

export const logout = () => {
  useSessionStore.getState().clear();
  queryClient.clear();
};
