export type ID = number;

/** DRF paginated response: GET list endpoints of the backend. */
export interface ApiPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Query params every DRF list endpoint accepts. */
export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  /** DRF ordering: `field` or `-field`. */
  ordering?: string;
}

export type Option<V = string> = { label: string; value: V };
