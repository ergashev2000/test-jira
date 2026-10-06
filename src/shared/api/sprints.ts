import { api } from '@/shared/lib/axios';
import type { ApiPaginated, ListParams, Sprint, SprintStatus } from '@/shared/types';

export interface SprintQuery extends ListParams {
  project?: number;
  /** One status or several. */
  status?: SprintStatus | SprintStatus[];
}

/**
 * One request. With a project it goes to GET /projects/:id/sprints/, which adds `tasks_total` /
 * `tasks_done` / `progress` and supports `?search=` (GET /sprints/ has neither yet).
 */
const fetchPage = async ({ project, ...params }: Omit<SprintQuery, 'status'> & { status?: SprintStatus }) => {
  const url = project ? `/projects/${project}/sprints/` : '/sprints/';
  const { data } = await api.get<ApiPaginated<Sprint>>(url, { params });
  return data;
};

const DATE_FIELDS = ['start_date', 'end_date', 'created_at'] as const;

/** Re-applies a simple date ordering after merging several responses. */
const sortMerged = (rows: Sprint[], ordering?: string) => {
  const desc = ordering?.startsWith('-');
  const field = DATE_FIELDS.find((f) => f === ordering?.replace(/^-/, ''));
  if (!field) return rows;
  return [...rows].sort((a, b) => (desc ? -1 : 1) * String(a[field]).localeCompare(String(b[field])));
};

/** GET sprints. `?status=` takes a single value on the backend, so several statuses = one request each, merged. */
export const fetchSprints = async ({ status, ...params }: SprintQuery = {}): Promise<ApiPaginated<Sprint>> => {
  const statuses = Array.isArray(status) ? status : status ? [status] : [];
  if (statuses.length <= 1) return fetchPage({ ...params, status: statuses[0] });
  const pages = await Promise.all(statuses.map((s) => fetchPage({ ...params, status: s })));
  return {
    count: pages.reduce((n, p) => n + p.count, 0),
    next: null,
    previous: null,
    results: sortMerged(pages.flatMap((p) => p.results), params.ordering),
  };
};
