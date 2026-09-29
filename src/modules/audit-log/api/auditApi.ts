import { db, mockRequest, paginate, requirePermission } from '@/shared/lib/mock';
import type { AuditEntityType, AuditLog, Source } from '@/shared/types';

export interface AuditParams {
  page?: number;
  pageSize?: number;
  actorId?: string;
  action?: string;
  entityType?: AuditEntityType;
  source?: Source;
  from?: string;
  to?: string;
}

export interface AuditRow extends AuditLog {
  actorName: string;
}

// GET /api/audit-logs   (read-only — no edit/delete endpoints exist)
export const listAuditLogs = (p: AuditParams = {}) =>
  mockRequest(() => {
    requirePermission('auditLog.view');
    const items = db.auditLogs
      .filter((a) => !p.actorId || a.actorId === p.actorId)
      .filter((a) => !p.action || a.action === p.action)
      .filter((a) => !p.entityType || a.entityType === p.entityType)
      .filter((a) => !p.source || a.source === p.source)
      .filter((a) => !p.from || a.createdAt.slice(0, 10) >= p.from)
      .filter((a) => !p.to || a.createdAt.slice(0, 10) <= p.to)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map<AuditRow>((a) => ({ ...a, actorName: db.users.find((u) => u.id === a.actorId)?.fullName ?? 'System' }));
    return paginate(items, p.page ?? 1, p.pageSize ?? 20);
  }, 350);

// GET /api/audit-logs/actions
export const listAuditActions = () => mockRequest(() => [...new Set(db.auditLogs.map((a) => a.action))].sort(), 150);
