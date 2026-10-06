// Read-only: no edit/delete endpoints. GET /audit-logs/ is SUPER_ADMIN only for now (ADMIN gets `audit.view` later).
import { isNotImplemented } from '@/shared/lib/apiError';
import { api } from '@/shared/lib/axios';
import type { ApiPaginated, AuditEntityType, AuditLog, ListParams, Source } from '@/shared/types';

export interface AuditParams extends ListParams {
  actor?: number;
  action?: string;
  entity_type?: AuditEntityType;
  source?: Source;
  date_from?: string;
  date_to?: string;
}

type RawAuditLog = Omit<AuditLog, 'entity_label' | 'entity_type' | 'old_value' | 'new_value'> & {
  entity_type: string;
  entity_label?: string;
  old_value: unknown;
  new_value: unknown;
};

/** Values may be objects, plain strings or null — the UI diffs objects. */
const asRecord = (v: unknown): Record<string, unknown> | null =>
  v === null || v === undefined || v === '' ? null : typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : { value: v };

const toAuditLog = (r: RawAuditLog): AuditLog => ({
  ...r,
  // `tasks.task` → `task`
  entity_type: (r.entity_type.split('.').pop() ?? r.entity_type) as AuditEntityType,
  // No `entity_label` yet — the id still links (projects / tasks are looked up by id too).
  entity_label: r.entity_label || r.entity_id,
  old_value: asRecord(r.old_value),
  new_value: asRecord(r.new_value),
});

// GET /audit-logs/?actor=&action=&entity_type=&source=&date_from=&date_to=&ordering=  (ordering: created_at only)
export const listAuditLogs = async (params: AuditParams = {}) => {
  const { data } = await api.get<ApiPaginated<RawAuditLog>>('/audit-logs/', { params });
  return { ...data, results: data.results.map(toAuditLog) };
};

// GET /audit-logs/actions/  → distinct action codes for the filter. Not on the backend yet:
// fall back to the actions seen in the latest 100 entries.
export const listAuditActions = async () => {
  try {
    const { data } = await api.get<string[]>('/audit-logs/actions/');
    return data;
  } catch (e) {
    if (!isNotImplemented(e)) throw e;
    const { data } = await api.get<ApiPaginated<RawAuditLog>>('/audit-logs/', { params: { page_size: 100, ordering: '-created_at' } });
    return [...new Set(data.results.map((r) => r.action))].sort();
  }
};
