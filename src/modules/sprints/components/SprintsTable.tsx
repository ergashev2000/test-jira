import { Progress, Table, Tag } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ProjectIcon } from '@/shared/components/ui';
import { ROUTES, SPRINT_STATUS } from '@/shared/constants';
import type { SprintStatus } from '@/shared/types';
import { formatDate, percent } from '@/shared/utils';

import type { SprintRow } from '../api/sprintsApi';
import { SprintActions } from './SprintActions';
import { CompleteSprintModal, SprintFormModal } from './SprintModals';

export const SprintsTable = ({ items, showProject, loading }: { items: SprintRow[]; showProject?: boolean; loading?: boolean }) => {
  const [editing, setEditing] = useState<SprintRow | null>(null);
  const [completing, setCompleting] = useState<SprintRow | null>(null);
  const activeByProject = new Set(items.filter((s) => s.status === 'ACTIVE').map((s) => s.projectId));

  return (
    <>
      <Table<SprintRow>
        className="app-table" size="middle" rowKey="id" dataSource={items} loading={loading} pagination={false} scroll={{ x: 1000 }}
        columns={[
          ...(showProject ? [{ title: 'Project', dataIndex: 'projectKey', width: 110, render: (_: unknown, s: SprintRow) => (
            <Link to={ROUTES.project(s.projectKey, 'sprints')} className="flex items-center gap-1.5 !text-fg"><ProjectIcon projectKey={s.projectKey} size={14} />{s.projectKey}</Link>) }] : []),
          { title: 'Name', dataIndex: 'name', width: 120, render: (n: string) => <span className="font-medium">{n}</span> },
          { title: 'Goal', dataIndex: 'goal', ellipsis: true, render: (g: string) => <span className="text-fg-2">{g || '—'}</span> },
          { title: 'Dates', key: 'dates', width: 200, render: (_, s) => <span className="text-fg-2">{formatDate(s.startDate)} — {formatDate(s.endDate)}</span> },
          { title: 'Status', dataIndex: 'status', width: 110, render: (st: SprintStatus) => <Tag color={SPRINT_STATUS[st].color}>{SPRINT_STATUS[st].label}</Tag> },
          { title: 'Tasks', key: 'tasks', width: 170, render: (_, s) => (
            <span className="flex items-center gap-2"><Progress percent={percent(s.done, s.total)} size="small" showInfo={false} className="!m-0 w-20" strokeColor="#165dff" />
              <span className="text-xs tabular-nums text-fg-2">{s.done}/{s.total}</span></span>) },
          { title: '', key: 'actions', width: 220, render: (_, s) => (
            <SprintActions sprint={s} hasActive={activeByProject.has(s.projectId)} onEdit={() => setEditing(s)} onComplete={() => setCompleting(s)} />) },
        ]}
      />
      <SprintFormModal open={!!editing} projectId={editing?.projectId ?? ''} sprint={editing ?? undefined} onClose={() => setEditing(null)} />
      <CompleteSprintModal sprint={completing} onClose={() => setCompleting(null)} />
    </>
  );
};
