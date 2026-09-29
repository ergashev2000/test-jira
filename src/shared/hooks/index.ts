import { useEffect, useState } from 'react';

import { hasPermission, type Permission } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';

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
  const role = useSessionStore((s) => s.user?.role);
  return hasPermission(role, permission);
};
