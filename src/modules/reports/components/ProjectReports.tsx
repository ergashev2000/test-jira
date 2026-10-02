import { useQuery } from '@tanstack/react-query';
import { Alert, Progress, Table, Tag } from 'antd';

import { DeadlineText, EmptyState, Panel, PriorityTag, QueryState, UserAvatar } from '@/shared/components/ui';
import { PRIORITY, QUERY_KEYS, SPRINT_STATUS, TASK_STATUS } from '@/shared/constants';
import { useUserMap } from '@/shared/api/lookups';
import type { SprintStatus } from '@/shared/types';
import { formatDate, formatDateTime, fromNow } from '@/shared/utils';

import { getProjectReport, getSprintReport } from '../api/reportsApi';
import { DonutChart, HBarChart, Legend } from './charts';

const Stat = ({ label, value, color }: { label: string; value: number | string; color?: string }) => (
  <div className="rounded-xl border border-line bg-surface p-3">
    <div className="text-xs text-fg-2">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
  </div>
);

export const SprintReportView = ({ sprintId }: { sprintId: string }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.sprint(sprintId), queryFn: () => getSprintReport(sprintId) });
  return (
    <QueryState query={query}>
      {({ sprint, report, live, moved, movedToName }) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-2">
            <b className="text-sm text-fg">{sprint.name}</b>
            <Tag color={SPRINT_STATUS[sprint.status].color}>{SPRINT_STATUS[sprint.status].label}</Tag>
            {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
            <span className="ml-auto">{live ? 'Live (computed now)' : `Snapshot generated ${formatDateTime(report.generatedAt)}`}</span>
          </div>
          {sprint.goal && <Alert type="info" message={<span><b>Goal:</b> {sprint.goal}</span>} />}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
            <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-4">
              <Progress type="circle" percent={report.completionPercent} strokeColor="#165dff" size={150}
                format={(p) => <span className="text-fg"><div className="text-3xl font-semibold">{p}%</div><div className="text-xs text-fg-2">completion</div></span>} />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Stat label="Total tasks" value={report.totalTasks} />
              <Stat label="Completed" value={report.completed} color="#4cb782" />
              <Stat label="Unfinished" value={report.unfinished} color={report.unfinished ? '#f2994a' : undefined} />
              <Stat label="Cancelled" value={report.cancelled} />
              <Stat label="Blocked" value={report.blocked} color={report.blocked ? '#eb5757' : undefined} />
              <Stat label="Overdue" value={report.overdue} color={report.overdue ? '#eb5757' : undefined} />
            </div>
          </div>
          <Panel title={`Tasks moved to ${movedToName}`}>
            {moved.length ? (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {moved.map((t) => <li key={t.id} className="text-[13px]"><span className="font-mono text-xs text-fg-3">{t.key}</span> {t.title}</li>)}
              </ul>
            ) : <span className="text-fg-3">{live ? 'Available after the sprint is completed' : 'No tasks were moved'}</span>}
          </Panel>
        </div>
      )}
    </QueryState>
  );
};

export const ProjectReportView = ({ projectId }: { projectId: string }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.project(projectId), queryFn: () => getProjectReport(projectId) });
  const users = useUserMap();
  return (
    <QueryState query={query}>
      {(r) => {
        const statusData = r.byStatus.map((s) => ({ name: TASK_STATUS[s.status].label, value: s.count, color: TASK_STATUS[s.status].color }));
        const prioData = r.byPriority.map((p) => ({ name: PRIORITY[p.priority].label, value: p.count, color: PRIORITY[p.priority].color }));
        return (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title={`Tasks by status · ${r.total}`}>
              <div className="grid grid-cols-[1fr_160px] items-center gap-4"><DonutChart data={statusData} center={String(r.total)} /><Legend data={statusData} /></div>
            </Panel>
            <Panel title="Open tasks by priority"><HBarChart data={prioData} /></Panel>
            <Panel title="Sprints" bodyClassName="!p-0">
              <Table className="app-table" size="small" rowKey="id" dataSource={r.sprints} pagination={false}
                columns={[
                  { title: 'Sprint', dataIndex: 'name' },
                  { title: 'Status', dataIndex: 'status', render: (s: SprintStatus) => <Tag color={SPRINT_STATUS[s].color}>{SPRINT_STATUS[s].label}</Tag> },
                  { title: 'Dates', key: 'd', render: (_, s) => <span className="text-xs text-fg-2">{formatDate(s.startDate)} — {formatDate(s.endDate)}</span> },
                  { title: 'Completion', dataIndex: 'completion', width: 150, render: (c: number) => <Progress percent={c} size="small" strokeColor="#165dff" /> },
                ]} />
            </Panel>
            <Panel title="Member workload (active tasks)">
              {r.workload.length ? (
                <HBarChart data={r.workload.map((w) => ({ name: users.get(w.userId)?.fullName ?? w.userId, value: w.active, color: w.active >= 10 ? '#eb5757' : '#165dff' }))} />
              ) : <EmptyState description="No active tasks" />}
            </Panel>
            <Panel title={`Active blockers · ${r.blockers.length}`}>
              {r.blockers.length ? r.blockers.map((b) => (
                <div key={b.id} className="flex items-center gap-2 border-b border-line py-2 text-[13px] last:border-0">
                  <UserAvatar userId={b.assigneeId} /><span className="font-mono text-xs text-fg-3">{b.key}</span>
                  <span className="flex-1 truncate">{b.title}<div className="text-xs text-danger">{b.blockerReason}</div></span>
                  <span className="text-xs text-fg-3">{fromNow(b.since)}</span>
                </div>
              )) : <EmptyState description="No active blockers" />}
            </Panel>
            <Panel title={`Overdue · ${r.overdue.length}`}>
              {r.overdue.length ? r.overdue.map((t) => (
                <div key={t.id} className="flex items-center gap-2 border-b border-line py-2 text-[13px] last:border-0">
                  <PriorityTag priority={t.priority} iconOnly /><span className="font-mono text-xs text-fg-3">{t.key}</span>
                  <span className="flex-1 truncate">{t.title}</span><UserAvatar userId={t.assigneeId} />
                  <DeadlineText task={{ deadline: t.deadline, status: t.status }} className="text-xs" />
                </div>
              )) : <EmptyState description="Nothing overdue" />}
            </Panel>
          </div>
        );
      }}
    </QueryState>
  );
};
