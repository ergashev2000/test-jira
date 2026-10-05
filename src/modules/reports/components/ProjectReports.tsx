import { useQuery } from '@tanstack/react-query';
import { Alert, Progress, Table, Tag } from 'antd';

import { useSprints } from '@/modules/sprints';
import { useTaskList, type Task } from '@/modules/tasks';
import { DeadlineText, EmptyState, Panel, PriorityTag, QueryState, UserAvatar } from '@/shared/components/ui';
import { PRIORITY, PRIORITY_ORDER, QUERY_KEYS, SPRINT_STATUS, STATUS_ORDER, TASK_STATUS } from '@/shared/constants';
import type { Sprint, SprintStatus } from '@/shared/types';
import { formatDate, formatDateTime, fromNow, percent } from '@/shared/utils';

import { getProjectReport, getSprintReport } from '../api/reportsApi';
import { DonutChart, HBarChart, Legend } from './charts';

const Stat = ({ label, value, color }: { label: string; value: number | string; color?: string }) => (
  <div className="rounded-xl border border-line bg-surface p-3">
    <div className="text-xs text-fg-2">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
  </div>
);

export const SprintReportView = ({ sprintId }: { sprintId: number }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.sprint(String(sprintId)), queryFn: () => getSprintReport(sprintId) });
  return (
    <QueryState query={query}>
      {(report) => {
        const { sprint } = report;
        const live = !report.is_snapshot;
        const moved = report.moved_tasks ?? [];
        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg-2">
              <b className="text-sm text-fg">{sprint.name}</b>
              {sprint.status && <Tag color={SPRINT_STATUS[sprint.status].color}>{SPRINT_STATUS[sprint.status].label}</Tag>}
              {formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
              <span className="ml-auto">{live ? 'Live (computed now)' : `Snapshot generated ${formatDateTime(report.generated_at)}`}</span>
            </div>
            {sprint.goal && <Alert type="info" message={<span><b>Goal:</b> {sprint.goal}</span>} />}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
              <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-4">
                <Progress type="circle" percent={report.completion_percent} strokeColor="#165dff" size={150}
                  format={(p) => <span className="text-fg"><div className="text-3xl font-semibold">{p}%</div><div className="text-xs text-fg-2">completion</div></span>} />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat label="Total tasks" value={report.total} />
                <Stat label="Completed" value={report.completed} color="#4cb782" />
                <Stat label="Unfinished" value={report.unfinished} color={report.unfinished ? '#f2994a' : undefined} />
                <Stat label="Cancelled" value={report.cancelled} />
                <Stat label="Blocked" value={report.blocked} color={report.blocked ? '#eb5757' : undefined} />
                <Stat label="Overdue" value={report.overdue} color={report.overdue ? '#eb5757' : undefined} />
              </div>
            </div>
            <Panel title={`Tasks moved to ${report.moved_to?.name ?? 'Backlog'} · ${report.moved_to_backlog}`}>
              {moved.length ? (
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {moved.map((t) => <li key={t.key} className="text-[13px]"><span className="font-mono text-xs text-fg-3">{t.key}</span> {t.title}</li>)}
                </ul>
              ) : <span className="text-fg-3">{live ? 'Available after the sprint is completed' : 'No tasks were moved'}</span>}
            </Panel>
          </div>
        );
      }}
    </QueryState>
  );
};

const TaskLine = ({ t, trailing }: { t: Task; trailing: React.ReactNode }) => (
  <div className="flex items-center gap-2 border-b border-line py-2 text-[13px] last:border-0">
    <PriorityTag priority={t.priority} iconOnly /><span className="font-mono text-xs text-fg-3">{t.key}</span>
    <span className="flex-1 truncate">{t.title}{t.active_blocker && <div className="text-xs text-danger">{t.active_blocker.reason}</div>}</span>
    <UserAvatar user={t.assignee} />
    {trailing}
  </div>
);

export const ProjectReportView = ({ projectId }: { projectId: number }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.project(String(projectId)), queryFn: () => getProjectReport(projectId) });
  const sprints = useSprints({ project: projectId, ordering: '-start_date', page_size: 50 });
  const blockers = useTaskList({ project: projectId, is_blocked: true, ordering: 'updated_at', page_size: 50 });
  const overdue = useTaskList({ project: projectId, deadline: 'overdue', ordering: 'deadline', page_size: 50 });
  return (
    <QueryState query={query}>
      {(r) => {
        const statusData = STATUS_ORDER.map((s) => ({ name: TASK_STATUS[s].label, value: r.by_status[s] ?? 0, color: TASK_STATUS[s].color }));
        const prioData = PRIORITY_ORDER.map((p) => ({ name: PRIORITY[p].label, value: r.by_priority?.[p] ?? 0, color: PRIORITY[p].color }));
        const workload = r.workload ?? [];
        return (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title={`Tasks by status · ${r.total_tasks}`}>
              <div className="grid grid-cols-[1fr_160px] items-center gap-4"><DonutChart data={statusData} center={String(r.total_tasks)} /><Legend data={statusData} /></div>
            </Panel>
            <Panel title="Open tasks by priority">
              {r.by_priority ? <HBarChart data={prioData} /> : <EmptyState description="Not provided by the backend yet" />}
            </Panel>
            <Panel title="Sprints" bodyClassName="!p-0">
              <Table<Sprint> className="app-table" size="small" rowKey="id" dataSource={sprints.data?.results ?? []} loading={sprints.isLoading} pagination={false}
                columns={[
                  { title: 'Sprint', dataIndex: 'name' },
                  { title: 'Status', dataIndex: 'status', render: (s: SprintStatus) => <Tag color={SPRINT_STATUS[s].color}>{SPRINT_STATUS[s].label}</Tag> },
                  { title: 'Dates', key: 'd', render: (_, s) => <span className="text-xs text-fg-2">{formatDate(s.start_date)} — {formatDate(s.end_date)}</span> },
                  { title: 'Completion', key: 'completion', width: 150, render: (_, s) => <Progress percent={percent(s.tasks_done ?? 0, s.tasks_total ?? 0)} size="small" strokeColor="#165dff" /> },
                ]} />
            </Panel>
            <Panel title="Member workload (active tasks)">
              {workload.length ? (
                <HBarChart data={workload.map((w) => ({ name: w.user.full_name, value: w.active, color: w.active >= 10 ? '#eb5757' : '#165dff' }))} />
              ) : <EmptyState description="No active tasks" />}
            </Panel>
            <Panel title={`Active blockers · ${r.blocked}`}>
              {blockers.data?.results.length
                ? blockers.data.results.map((t) => <TaskLine key={t.id} t={t} trailing={<span className="text-xs text-fg-3">{fromNow(t.active_blocker?.created_at ?? t.updated_at)}</span>} />)
                : <EmptyState description="No active blockers" />}
            </Panel>
            <Panel title={`Overdue · ${r.overdue}`}>
              {overdue.data?.results.length
                ? overdue.data.results.map((t) => <TaskLine key={t.id} t={t} trailing={<DeadlineText task={t} className="text-xs" />} />)
                : <EmptyState description="Nothing overdue" />}
            </Panel>
          </div>
        );
      }}
    </QueryState>
  );
};
