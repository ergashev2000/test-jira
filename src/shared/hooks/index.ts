import { useEffect, useState } from 'react';

import { hasPermission, type Permission } from '@/shared/constants';
import { roleOf, useSessionStore } from '@/shared/lib/session';

export { useCurrentUser } from './useCurrentUser';
export { useTableParams } from './useTableParams';

export const useDebounce = <T,>(value: T, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

export const usePermission = (permission: Permission) => {
  const role = useSessionStore((s) => roleOf(s.user));
  return hasPermission(role, permission);
};
