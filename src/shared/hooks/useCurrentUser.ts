import { useSessionStore } from '@/shared/lib/session';
import type { Me } from '@/shared/types';

/**
 * Signed-in user. Only for screens behind ProtectedRoute, which renders nothing until the user
 * is loaded — so this never returns null there. Outside of it, read `useSessionStore` directly.
 */
export const useCurrentUser = (): Me => {
  const user = useSessionStore((s) => s.user);
  if (!user) throw new Error('useCurrentUser must be used inside ProtectedRoute');
  return user;
};
