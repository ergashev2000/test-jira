import { useQuery } from '@tanstack/react-query';
import { Table, Tag, Tooltip } from 'antd';
import { Link } from 'react-router-dom';

import { FilterBar, PageHeader, QueryState, SourceBadge, UserAvatar } from '@/shared/components/ui';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { AuditEntityType, Source } from '@/shared/types';
import { formatDateTime, fromNow } from '@/shared/utils';

import { listAuditActions, listAuditLogs, type AuditRow } from '../api/auditApi';

const SOURCE_COLORS: Record<Source, string> = { WEB: 'blue', TELEGRAM: 'cyan', API: 'purple' };
const ENTITY_TYPES: AuditEntityType[] = ['TASK', 'PROJECT', 'SPRINT', 'USER', 'TEAM', 'SETTINGS'];

const fmt = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

const Diff = ({ row }: { row: AuditRow }) => {
  const keys = [...new Set([...Object.keys(row.oldValue ?? {}), ...Object.keys(row.newValue ?? {})])].slice(0, 3);
  if (!keys.length) return <span className="text-fg-3">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {keys.map((k) => (
        <span key={k} className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-fg-3">{k}:</span>
          {row.oldValue && k in row.oldValue && <Tag className="!m-0 line-through opacity-70">{fmt(row.oldValue[k])}</Tag>}
          {row.oldValue && k in row.oldValue && '→'}
          {row.newValue && k in row.newValue && <Tag color="green" className="!m-0 max-w-60 truncate">{fmt(row.newValue[k])}</Tag>}
        </span>
      ))}
    </div>
  );
};

/** "Shohrux changed CRM-110 status from TODO to IN_PROGRESS via TELEGRAM" */
const sentence = (r: AuditRow) => {
  const status = r.oldValue?.status !== undefined && r.newValue?.status !== undefined
    ? ` from ${String(r.oldValue.status)} to ${String(r.newValue.status)}` : '';
  return `${r.actorName} ${r.action.toLowerCase().replace(/_/g, ' ')} ${r.entityLabel}${status} via ${r.source}`;
};

export const AuditLogPage = () => {
  const { get, page, pageSize, pagination } = useTableParams();
  const actions = useQuery({ queryKey: ['audit-log', 'actions'], queryFn: listAuditActions });
  const params = {
    page, pageSize, actorId: get('actorId'), action: get('action'), entityType: get('entityType') as AuditEntityType | undefined,
    source: get('source') as Source | undefined, from: get('from'), to: get('to'),
  };
  const query = useQuery({ queryKey: QUERY_KEYS.auditLog(params), queryFn: () => listAuditLogs(params), placeholderData: (x) => x });

  return (
    <>
      <PageHeader title="Audit log" count={query.data?.total} extra={<span className="text-xs text-fg-3">Read-only · entries are never modified</span>}>
        <FilterBar filters={[
          { type: 'user', key: 'actorId', placeholder: 'Actor' },
          { type: 'select', key: 'action', placeholder: 'Action', width: 200, options: (actions.data ?? []).map((a) => ({ value: a, label: a })) },
          { type: 'select', key: 'entityType', placeholder: 'Entity', options: ENTITY_TYPES.map((e) => ({ value: e, label: e })) },
          { type: 'select', key: 'source', placeholder: 'Source', width: 120, options: [{ value: 'WEB', label: 'Web' }, { value: 'TELEGRAM', label: 'Telegram' }, { value: 'API', label: 'API' }] },
          { type: 'dateRange', from: 'from', to: 'to' },
        ]} />
      </PageHeader>
      <QueryState query={query}>
        {(d) => (
          <Table<AuditRow> className="app-table" size="small" rowKey="id" dataSource={d.items} loading={query.isFetching}
            scroll={{ x: 1300 }} pagination={{ ...pagination, total: d.total }}
            expandable={{
              expandedRowRender: (r) => (
                <div className="flex flex-col gap-2 py-1">
                  <div className="text-[13px] text-fg">{sentence(r)}</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(['oldValue', 'newValue'] as const).map((k) => (
                      <div key={k}>
                        <div className="mb-1 text-xs text-fg-3">{k === 'oldValue' ? 'Old value' : 'New value'}</div>
                        <pre className="m-0 overflow-auto rounded-md border border-line bg-bg p-2 text-xs text-fg-2">{JSON.stringify(r[k], null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            }}
            columns={[
              { title: 'Timestamp', dataIndex: 'createdAt', width: 150, render: (v: string) => <Tooltip title={fromNow(v)}><span className="text-fg-2">{formatDateTime(v)}</span></Tooltip> },
              { title: 'Actor', dataIndex: 'actorId', width: 190, render: (id: string) => <UserAvatar userId={id} showName size={18} /> },
              { title: 'Action', dataIndex: 'action', width: 210, render: (a: string) => <span className="font-mono text-xs">{a}</span> },
              { title: 'Entity', dataIndex: 'entityType', width: 90, render: (e: string) => <Tag className="!m-0">{e}</Tag> },
              { title: 'Entity ID', dataIndex: 'entityLabel', width: 150, render: (l: string, r) =>
                r.entityType === 'TASK' ? <Link to={ROUTES.task(l)} className="font-mono text-xs">{l}</Link>
                  : r.entityType === 'PROJECT' ? <Link to={ROUTES.project(l)} className="font-mono text-xs">{l}</Link>
                    : <span className="text-xs text-fg-2">{l}</span> },
              { title: 'Old → New', key: 'diff', render: (_, r) => <Diff row={r} /> },
              { title: 'Source', dataIndex: 'source', width: 110, render: (s: Source) => <Tag color={SOURCE_COLORS[s]} className="!m-0"><SourceBadge source={s} /></Tag> },
              { title: 'IP address', dataIndex: 'ipAddress', width: 130, render: (ip: string) => <span className="font-mono text-xs text-fg-2">{ip}</span> },
            ]} />
        )}
      </QueryState>
    </>
  );
};
