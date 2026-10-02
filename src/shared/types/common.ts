export type ID = string;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** DRF paginated response: GET list endpoints of the real backend. */
export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export type Option<V = string> = { label: string; value: V };
