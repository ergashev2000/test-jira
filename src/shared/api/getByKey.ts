import { ApiError } from '@/shared/lib/apiError';
import { api } from '@/shared/lib/axios';
import type { ApiPaginated } from '@/shared/types';

/**
 * GET a project / task by its key (`CRM`, `CRM-3`). The backend looks these up by numeric id only
 * for now (404 on a key), so a 404 for a key is resolved through the list's `?search=` and an exact
 * key match. Once the backend accepts keys the first request succeeds and the fallback never runs.
 */
export const getByKey = async <T extends { key: string }>(key: string, detailUrl: string, listUrl: string): Promise<T> => {
  try {
    const { data } = await api.get<T>(detailUrl);
    return data;
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 404 || /^\d+$/.test(key)) throw e;
    const { data } = await api.get<ApiPaginated<T>>(listUrl, { params: { search: key, page_size: 20 } });
    const hit = data.results.find((x) => x.key.toLowerCase() === key.toLowerCase());
    if (!hit) throw e;
    return hit;
  }
};
