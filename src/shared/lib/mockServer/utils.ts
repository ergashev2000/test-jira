/** A handler throws this to answer with an error status (the adapter turns it into an AxiosError). */
export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, detail: string | Record<string, string[]>) {
    super(typeof detail === 'string' ? detail : Object.values(detail)[0]?.[0] ?? 'Error');
    this.status = status;
    // Same envelope as the real backend: { error: { status_code, detail } } / field errors.
    this.body = typeof detail === 'string' ? { error: { status_code: status, detail: { detail } } } : detail;
  }
}

export const notFound = (what = 'Not found') => new HttpError(404, what);
export const badRequest = (detail: string | Record<string, string[]>) => new HttpError(400, detail);

export type Query = Record<string, unknown>;

/** Query param as a list — repeated keys arrive as arrays, single ones as scalars. */
export const many = (q: Query, key: string): string[] => {
  const v = q[key];
  if (v === undefined || v === null || v === '') return [];
  return (Array.isArray(v) ? v : [v]).map(String).filter(Boolean);
};

export const one = (q: Query, key: string): string | undefined => many(q, key)[0];
export const num = (q: Query, key: string): number | undefined => (one(q, key) ? Number(one(q, key)) : undefined);
export const bool = (q: Query, key: string): boolean | undefined => {
  const v = one(q, key);
  return v === undefined ? undefined : v === 'true' || v === '1';
};

/** `project__key` → obj.project.key */
const pick = (obj: unknown, path: string): unknown =>
  path.split('__').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);

/** Weighted orderings — enums are sorted by meaning, not alphabetically. */
const WEIGHTS: Record<string, Record<string, number>> = {
  priority: { low: 1, medium: 2, high: 3, critical: 4 },
  status: { backlog: 1, todo: 2, in_progress: 3, review: 4, ready_for_testing: 5, done: 6, cancelled: 7, planning: 1, active: 2, on_hold: 3, completed: 4, archived: 5, planned: 1 },
};

const compare = (a: unknown, b: unknown, field: string) => {
  const w = WEIGHTS[field.split('__').pop() ?? ''];
  if (w && typeof a === 'string' && typeof b === 'string') return (w[a] ?? 0) - (w[b] ?? 0);
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
};

export interface ListOptions<T> {
  /** Fields matched by `?search=` (case-insensitive substring, `__` for nested). */
  search?: string[];
  /** Applied when the request has no `?ordering=`. */
  ordering?: string;
  /** Unpaginated endpoints (roles, permissions) return a plain array. */
  paginate?: boolean;
  /** Extra derived sort keys: ordering field → value getter. */
  sortKeys?: Record<string, (row: T) => unknown>;
}

/** DRF-like list: search → ordering → `{count, next, previous, results}`. */
export const list = <T extends object>(rows: T[], q: Query, opts: ListOptions<T> = {}) => {
  const term = one(q, 'search')?.toLowerCase().trim();
  let out = term && opts.search
    ? rows.filter((r) => opts.search!.some((f) => String(pick(r, f) ?? '').toLowerCase().includes(term)))
    : [...rows];

  const ordering = (one(q, 'ordering') ?? opts.ordering ?? '').split(',').filter(Boolean);
  if (ordering.length) {
    out = out.sort((a, b) => {
      for (const o of ordering) {
        const desc = o.startsWith('-');
        // Backend's weighted priority ordering is called priority_order.
        const field = (desc ? o.slice(1) : o).replace(/^priority_order$/, 'priority');
        const get = opts.sortKeys?.[field] ?? ((r: T) => pick(r, field));
        const c = compare(get(a), get(b), field);
        if (c) return desc ? -c : c;
      }
      return 0;
    });
  }

  if (opts.paginate === false) return out;
  const page = Math.max(1, num(q, 'page') ?? 1);
  const size = Math.max(1, num(q, 'page_size') ?? 20);
  const start = (page - 1) * size;
  return {
    count: out.length,
    next: start + size < out.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: out.slice(start, start + size),
  };
};

export const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
