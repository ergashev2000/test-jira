import { useQuery } from '@tanstack/react-query';
import { Tag, Tooltip } from 'antd';
import { Link } from 'react-router-dom';

import { DataTable, FilterBar, PageHeader, SourceBadge, UserAvatar } from '@/shared/components/ui';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { AuditEntityType, AuditLog, Source, UserBrief } from '@/shared/types';
import { formatDateTime, fromNow } from '@/shared/utils';

import { listAuditActions, listAuditLogs } from '../api/auditApi';

type AuditRow = AuditLog;

const SOURCE_COLORS: Record<Source, string> = { web: 'blue', telegram: 'cyan', api: 'purple' };
const ENTITY_TYPES: AuditEntityType[] = ['task', 'project', 'sprint', 'user', 'team', 'settings'];

const fmt = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

const Diff = ({ row }: { row: AuditRow }) => {
  const keys = [...new Set([...Object.keys(row.old_value ?? {}), ...Object.keys(row.new_value ?? {})])].slice(0, 3);
  if (!keys.length) return <span className="text-fg-3">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {keys.map((k) => (
        <span key={k} className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-fg-3">{k}:</span>
          {row.old_value && k in row.old_value && <Tag className="!m-0 line-through opacity-70">{fmt(row.old_value[k])}</Tag>}
          {row.old_value && k in row.old_value && '→'}
          {row.new_value && k in row.new_value && <Tag color="green" className="!m-0 max-w-60 truncate">{fmt(row.new_value[k])}</Tag>}
        </span>
      ))}
    </div>
  );
};

/** "Shohrux changed CRM-110 status from TODO to IN_PROGRESS via TELEGRAM" */
const sentence = (r: AuditRow) => {
  const status = r.old_value?.status !== undefined && r.new_value?.status !== undefined
    ? ` from ${String(r.old_value.status)} to ${String(r.new_value.status)}` : '';
  return `${r.actor?.full_name ?? 'System'} ${r.action.toLowerCase().replace(/_/g, ' ')} ${r.entity_label}${status} via ${r.source}`;
};

export const AuditLogPage = () => {
  const { get, page, pageSize, ordering } = useTableParams();
  const actions = useQuery({ queryKey: ['audit-log', 'actions'], queryFn: listAuditActions });
  const params = {
    page, page_size: pageSize, ordering: ordering ?? '-created_at', actor: get('actor') ? Number(get('actor')) : undefined, action: get('action'),
    entity_type: get('entity_type') as AuditEntityType | undefined, source: get('source') as Source | undefined, date_from: get('from'), date_to: get('to'),
  };
  const query = useQuery({ queryKey: QUERY_KEYS.auditLog(params), queryFn: () => listAuditLogs(params), placeholderData: (x) => x });

  return (
    <>
      <PageHeader title="Audit log" count={query.data?.count} extra={<span className="text-xs text-fg-3">Read-only · entries are never modified</span>}>
        <FilterBar filters={[
          { type: 'user', key: 'actor', placeholder: 'Actor' },
          { type: 'select', key: 'action', placeholder: 'Action', width: 200, options: (actions.data ?? []).map((a) => ({ value: a, label: a })) },
          { type: 'select', key: 'entity_type', placeholder: 'Entity', options: ENTITY_TYPES.map((e) => ({ value: e, label: e })) },
          { type: 'select', key: 'source', placeholder: 'Source', width: 120, options: [{ value: 'web', label: 'Web' }, { value: 'telegram', label: 'Telegram' }, { value: 'api', label: 'API' }] },
          { type: 'dateRange', from: 'from', to: 'to' },
        ]} />
      </PageHeader>
          <DataTable<AuditRow> size="small" query={query} rowNumbers={false} scroll={{ x: 1300 }}
            expandable={{
              expandedRowRender: (r) => (
                <div className="flex flex-col gap-2 py-1">
                  <div className="text-[13px] text-fg">{sentence(r)}</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(['old_value', 'new_value'] as const).map((k) => (
                      <div key={k}>
                        <div className="mb-1 text-xs text-fg-3">{k === 'old_value' ? 'Old value' : 'New value'}</div>
                        <pre className="m-0 overflow-auto rounded-md border border-line bg-bg p-2 text-xs text-fg-2">{JSON.stringify(r[k], null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            }}
            columns={[
              { title: 'Timestamp', dataIndex: 'created_at', width: 150, sorter: true, render: (v: string) => <Tooltip title={fromNow(v)}><span className="text-fg-2">{formatDateTime(v)}</span></Tooltip> },
              { title: 'Actor', dataIndex: 'actor', key: 'actor__full_name', width: 190, sorter: true, render: (u: UserBrief | null) => <UserAvatar user={u} showName size={18} /> },
              { title: 'Action', dataIndex: 'action', width: 210, sorter: true, render: (a: string) => <span className="font-mono text-xs">{a}</span> },
              { title: 'Entity', dataIndex: 'entity_type', width: 90, sorter: true, render: (e: string) => <Tag className="!m-0">{e}</Tag> },
              { title: 'Entity ID', dataIndex: 'entity_label', width: 150, render: (l: string, r) =>
                r.entity_type === 'task' ? <Link to={ROUTES.task(r.entity_id)} className="font-mono text-xs">{l}</Link>
                  : r.entity_type === 'project' ? <Link to={ROUTES.project(r.entity_id)} className="font-mono text-xs">{l}</Link>
                    : <span className="text-xs text-fg-2">{l}</span> },
              { title: 'Old → New', key: 'diff', render: (_, r) => <Diff row={r} /> },
              { title: 'Source', dataIndex: 'source', width: 110, sorter: true, render: (s: Source) => <Tag color={SOURCE_COLORS[s]} className="!m-0"><SourceBadge source={s} /></Tag> },
              { title: 'IP address', dataIndex: 'ip_address', width: 130, render: (ip: string) => <span className="font-mono text-xs text-fg-2">{ip}</span> },
            ]} />
    </>
  );
};
