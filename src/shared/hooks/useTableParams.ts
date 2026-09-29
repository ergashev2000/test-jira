import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DEFAULT_PAGE_SIZE } from '@/shared/constants';

type ParamValue = string | number | boolean | string[] | null | undefined;

/**
 * URL <-> filters/tab/pagination sync. Everything lives in query params
 * so a reload or a shared link restores the exact view.
 */
export const useTableParams = (defaultPageSize = DEFAULT_PAGE_SIZE) => {
  const [sp, setSp] = useSearchParams();

  const get = useCallback((key: string) => sp.get(key) ?? undefined, [sp]);
  const getArray = useCallback((key: string) => sp.getAll(key).filter(Boolean), [sp]);
  const getBool = useCallback((key: string) => sp.get(key) === 'true', [sp]);

  const page = Number(sp.get('page') ?? 1) || 1;
  const pageSize = Number(sp.get('pageSize') ?? defaultPageSize) || defaultPageSize;

  const set = useCallback(
    (patch: Record<string, ParamValue>, resetPage = true) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            next.delete(k);
            if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
            else if (v !== undefined && v !== null && v !== '' && v !== false) next.set(k, String(v));
          }
          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSp],
  );

  const clear = useCallback(
    (keep: string[] = []) =>
      setSp(
        (prev) => {
          const next = new URLSearchParams();
          keep.forEach((k) => prev.getAll(k).forEach((v) => next.append(k, v)));
          return next;
        },
        { replace: true },
      ),
    [setSp],
  );

  const pagination = useMemo(
    () => ({
      current: page,
      pageSize,
      showSizeChanger: true,
      onChange: (p: number, ps: number) => set({ page: p, pageSize: ps }, false),
    }),
    [page, pageSize, set],
  );

  return { sp, get, getArray, getBool, set, clear, page, pageSize, pagination };
};
