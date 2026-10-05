import { Progress, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DataTable, ProjectIcon } from '@/shared/components/ui';
import { ROUTES, SPRINT_STATUS } from '@/shared/constants';
import type { ApiPaginated, SprintStatus } from '@/shared/types';
import { formatDate, percent } from '@/shared/utils';

import type { Sprint } from '../api/sprintsApi';
import { SprintActions } from './SprintActions';
import { CompleteSprintModal, SprintFormModal } from './SprintModals';

interface PagedQuery {
  data: ApiPaginated<Sprint> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** Server-paginated, server-sorted sprint list (page / ordering live in the URL). */
export const SprintsTable = ({ query, showProject }: { query: PagedQuery; showProject?: boolean }) => {
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [completing, setCompleting] = useState<Sprint | null>(null);
  const items = query.data?.results ?? [];
  const activeByProject = new Set(items.filter((s) => s.status === 'active').map((s) => s.project.id));

  const columns: ColumnsType<Sprint> = [
    ...(showProject ? [{ title: 'Project', key: 'project__key', width: 110, sorter: true, render: (_: unknown, s: Sprint) => (
      <Link to={ROUTES.project(s.project.key, 'sprints')} className="flex items-center gap-1.5 !text-fg"><ProjectIcon projectKey={s.project.key} size={14} />{s.project.key}</Link>) }] : []),
    { title: 'Name', dataIndex: 'name', width: 120, sorter: true, render: (n: string) => <span className="font-medium">{n}</span> },
    { title: 'Goal', dataIndex: 'goal', ellipsis: true, render: (g: string) => <span className="text-fg-2">{g || '—'}</span> },
    { title: 'Dates', key: 'start_date', width: 200, sorter: true, render: (_, s) => <span className="text-fg-2">{formatDate(s.start_date)} — {formatDate(s.end_date)}</span> },
    { title: 'Status', dataIndex: 'status', width: 110, sorter: true, render: (st: SprintStatus) => <Tag color={SPRINT_STATUS[st].color}>{SPRINT_STATUS[st].label}</Tag> },
    { title: 'Tasks', key: 'tasks', width: 170, render: (_, s) => (
      <span className="flex items-center gap-2"><Progress percent={percent(s.tasks_done ?? 0, s.tasks_total ?? 0)} size="small" showInfo={false} className="!m-0 w-20" strokeColor="#165dff" />
        <span className="text-xs tabular-nums text-fg-2">{s.tasks_done ?? 0}/{s.tasks_total ?? 0}</span></span>) },
    { title: '', key: 'actions', width: 220, render: (_, s) => (
      <SprintActions sprint={s} hasActive={activeByProject.has(s.project.id)} onEdit={() => setEditing(s)} onComplete={() => setCompleting(s)} />) },
  ];

  return (
    <>
      <DataTable<Sprint> query={query} columns={columns} rowNumbers={false} scroll={{ x: 1000 }} emptyText="No sprints" />
      <SprintFormModal open={!!editing} projectId={editing?.project.id ?? 0} sprint={editing ?? undefined} onClose={() => setEditing(null)} />
      <CompleteSprintModal sprint={completing} onClose={() => setCompleting(null)} />
    </>
  );
};
