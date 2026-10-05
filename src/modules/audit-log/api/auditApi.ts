// Audit log is NOT IN api.json yet — these are the endpoints the UI expects
// (see docs/BACKEND_REQUIREMENTS.md → audit-log). Read-only: no edit/delete endpoints.
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

// GET /audit-logs/?actor=&action=&entity_type=&source=&date_from=&date_to=&ordering=
export const listAuditLogs = async (params: AuditParams = {}) => {
  const { data } = await api.get<ApiPaginated<AuditLog>>('/audit-logs/', { params });
  return data;
};

// GET /audit-logs/actions/  → distinct action codes for the filter
export const listAuditActions = async () => {
  const { data } = await api.get<string[]>('/audit-logs/actions/');
  return data;
};
