import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { Progress, Table, Tag } from 'antd';
import type { ReactNode } from 'react';

import { EmptyState, Panel, PriorityTag, QueryState, StatusTag, UserAvatar } from '@/shared/components/ui';
import { QUERY_KEYS } from '@/shared/constants';
import type { DailyPlanStatus, DailyReport, ReportTaskLine } from '@/shared/types';
import { formatTime } from '@/shared/utils';

import { getMyDailyReport, getTeamDailyReport, getUserDailyReport } from '../api/reportsApi';

type GroupKey = 'completed' | 'inProgress' | 'blocked' | 'cancelled' | 'notStarted';

const GROUPS: { key: GroupKey; label: string; emoji: string; color: string; count: (r: DailyReport) => number; list: (r: DailyReport) => ReportTaskLine[] }[] = [
  { key: 'completed', label: 'Completed', emoji: '✅', color: '#4cb782', count: (r) => r.completed, list: (r) => r.completed_tasks },
  { key: 'inProgress', label: 'In Progress', emoji: '🟡', color: '#f2c94c', count: (r) => r.in_progress, list: (r) => r.in_progress_tasks ?? [] },
  { key: 'blocked', label: 'Blocked', emoji: '🚧', color: '#eb5757', count: (r) => r.blocked, list: (r) => r.blocked_tasks },
  { key: 'cancelled', label: 'Cancelled', emoji: '❌', color: '#6b6f76', count: (r) => r.cancelled, list: (r) => r.cancelled_tasks ?? [] },
  // Until the backend splits the list, "not completed" stands in for "not started".
  { key: 'notStarted', label: 'Not Started', emoji: '🔴', color: '#eb5757', count: (r) => r.not_started, list: (r) => r.not_started_tasks ?? r.not_completed_tasks },
];

const DAILY: Partial<Record<DailyPlanStatus, { label: string; color: string }>> = {
  planned: { label: 'Planned', color: 'blue' },
  worked: { label: 'Worked', color: 'green' },
  not_worked: { label: 'Not worked', color: 'red' },
  carried_over: { label: 'Carried over', color: 'orange' },
  done: { label: 'Done', color: 'green' },
  blocked: { label: 'Blocked', color: 'red' },
};

const Stat = ({ label, value, color, children }: { label: ReactNode; value: ReactNode; color?: string; children?: ReactNode }) => (
  <div className="rounded-xl border border-line bg-surface p-3">
    <div className="text-xs text-fg-2">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
    {children}
  </div>
);

const TaskList = ({ items }: { items: ReportTaskLine[] }) => (
  <Table<ReportTaskLine> className="app-table" size="small" rowKey="key" dataSource={items} pagination={false} scroll={{ x: 640 }}
    columns={[
      { title: 'Key', dataIndex: 'key', width: 100, render: (k: string) => <span className="font-mono text-xs text-fg-2">{k}</span> },
      { title: 'Title', dataIndex: 'title', render: (t: string, r) => <div>{t}{r.reason && <div className="text-xs text-danger">🚧 {r.reason}</div>}</div> },
      { title: 'Task status', dataIndex: 'status', width: 130, render: (_, r) => <StatusTag status={r.status} /> },
      { title: 'Daily status', dataIndex: 'planned_status', width: 120, render: (d: DailyPlanStatus | '') => (d && DAILY[d] ? <Tag color={DAILY[d].color}>{DAILY[d].label}</Tag> : <span className="text-fg-3">—</span>) },
      { title: 'Priority', dataIndex: 'priority', width: 100, render: (_, r) => (r.priority ? <PriorityTag priority={r.priority} iconOnly /> : <span className="text-fg-3">—</span>) },
    ]} />
);

/** `userId` omitted — the signed-in user's own report (GET /me/daily-report/). */
export const DailyReportView = ({ userId, date }: { userId?: number; date: string }) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.reports.daily(String(userId ?? 'me'), date),
    queryFn: () => (userId ? getUserDailyReport(userId, date) : getMyDailyReport(date)),
  });
  return (
    <QueryState query={query}>
      {(r) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-fg-2">
            {r.user && <UserAvatar user={r.user} showName />}
            {r.plan_confirmed_at
              ? <span className="flex items-center gap-1"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} className="hicon text-success" strokeWidth={1.7} />Plan confirmed at {formatTime(r.plan_confirmed_at)} via {r.confirmed_via === 'telegram' ? 'Telegram' : 'Web'}</span>
              : <span className="text-warn">Daily plan not confirmed</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {GROUPS.map((g) => <Stat key={g.key} label={`${g.emoji} ${g.label}`} value={g.count(r)} color={g.count(r) ? g.color : undefined} />)}
            <Stat label="Progress" value={`${r.completed}/${r.total}`}>
              <Progress percent={r.progress_percent} size="small" strokeColor="#165dff" />
            </Stat>
          </div>
          {GROUPS.filter((g) => g.list(r).length).map((g) => (
            <Panel key={g.key} title={`${g.emoji} ${g.label} · ${g.list(r).length}`} bodyClassName="!p-0">
              <TaskList items={g.list(r)} />
            </Panel>
          ))}
          {!r.total && <EmptyState description="No planned tasks for this day" />}
          <Panel title="Daily note">
            <p className="m-0 whitespace-pre-wrap">{r.note || <span className="text-fg-3">No note</span>}</p>
          </Panel>
        </div>
      )}
    </QueryState>
  );
};

export const TeamDailyReportView = ({ teamId, date }: { teamId: number; date: string }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.teamDaily(String(teamId), date), queryFn: () => getTeamDailyReport(teamId, date) });
  return (
    <QueryState query={query}>
      {(r) => (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Team progress" value={`${r.team_progress_percent}%`}><Progress percent={r.team_progress_percent} showInfo={false} size="small" strokeColor="#165dff" /></Stat>
            <Stat label="✅ Done / planned" value={`${r.members.reduce((s, m) => s + m.completed, 0)}/${r.members.reduce((s, m) => s + m.total, 0)}`} />
            <Stat label="🚧 Blockers" value={r.blockers} color={r.blockers ? '#eb5757' : undefined} />
            <Stat label="Members" value={r.members.length} />
          </div>
          <Panel title="Members" bodyClassName="!p-0">
            <Table className="app-table" size="middle" rowKey={(m) => m.user.id} dataSource={r.members} pagination={false} scroll={{ x: 700 }}
              columns={[
                { title: 'Member', dataIndex: 'user', render: (_, m) => <UserAvatar user={m.user} showName /> },
                { title: 'Plan', dataIndex: 'has_plan', width: 150, render: (_, m) => (m.has_plan
                  ? <span className="text-success">Confirmed{m.confirmed_at && ` ${formatTime(m.confirmed_at)}`}</span>
                  : <span className="text-warn">Not confirmed</span>) },
                { title: '✅ Done / planned', key: 'dp', width: 200, render: (_, m) => (
                  <span className="flex items-center gap-2"><Progress percent={m.progress_percent} size="small" showInfo={false} className="!m-0 w-20" strokeColor="#4cb782" />{m.completed}/{m.total}</span>) },
                { title: '🚧 Blocked', dataIndex: 'blocked', width: 110, render: (n: number) => <span className={n ? 'text-danger' : ''}>{n}</span> },
                { title: '🔴 Unfinished', dataIndex: 'unfinished', width: 120 },
              ]} />
          </Panel>
          {!!r.blocker_tasks?.length && (
            <Panel title="Blockers">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {r.blocker_tasks.map((b) => (
                  <li key={b.key} className="flex items-center gap-2 text-[13px]">
                    <UserAvatar user={b.assignee} /><span className="font-mono text-xs text-fg-3">{b.key}</span>{b.title}
                    <span className="text-xs text-danger">— {b.reason}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}
    </QueryState>
  );
};
