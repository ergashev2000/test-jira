import { useQuery } from '@tanstack/react-query';
import { Progress, Table, Tag } from 'antd';
import type { ReactNode } from 'react';

import { EmptyState, Icon, Panel, PriorityTag, QueryState, StatusTag, UserAvatar } from '@/shared/components/ui';
import { QUERY_KEYS } from '@/shared/constants';
import type { DailyTaskStatus } from '@/shared/types';
import { formatTime } from '@/shared/utils';

import { getDailyReport, getTeamDailyReport, type DailyGroup, type ReportTask } from '../api/reportsApi';

const GROUPS: { key: DailyGroup; label: string; emoji: string; color: string }[] = [
  { key: 'completed', label: 'Completed', emoji: '✅', color: '#4cb782' },
  { key: 'inProgress', label: 'In Progress', emoji: '🟡', color: '#f2c94c' },
  { key: 'blocked', label: 'Blocked', emoji: '🚧', color: '#eb5757' },
  { key: 'cancelled', label: 'Cancelled', emoji: '❌', color: '#6b6f76' },
  { key: 'notStarted', label: 'Not Started', emoji: '🔴', color: '#eb5757' },
];

const DAILY: Record<DailyTaskStatus, { label: string; color: string }> = {
  PLANNED: { label: 'Planned', color: 'blue' },
  WORKED: { label: 'Worked', color: 'green' },
  NOT_WORKED: { label: 'Not worked', color: 'red' },
  CARRIED_OVER: { label: 'Carried over', color: 'orange' },
};

const Stat = ({ label, value, color, children }: { label: ReactNode; value: ReactNode; color?: string; children?: ReactNode }) => (
  <div className="rounded-xl border border-line bg-surface p-3">
    <div className="text-xs text-fg-2">{label}</div>
    <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
    {children}
  </div>
);

const TaskList = ({ items }: { items: ReportTask[] }) => (
  <Table<ReportTask> className="app-table" size="small" rowKey="id" dataSource={items} pagination={false} scroll={{ x: 640 }}
    columns={[
      { title: 'Key', dataIndex: 'key', width: 100, render: (k: string) => <span className="font-mono text-xs text-fg-2">{k}</span> },
      { title: 'Title', dataIndex: 'title', render: (t: string, r) => <div>{t}{r.blockerReason && <div className="text-xs text-danger">🚧 {r.blockerReason}</div>}</div> },
      { title: 'Task status', dataIndex: 'status', width: 130, render: (_, r) => <StatusTag status={r.status} /> },
      { title: 'Daily status', dataIndex: 'dailyStatus', width: 120, render: (d: DailyTaskStatus | null) => d ? <Tag color={DAILY[d].color}>{DAILY[d].label}</Tag> : <span className="text-fg-3">—</span> },
      { title: 'Priority', dataIndex: 'priority', width: 100, render: (_, r) => <PriorityTag priority={r.priority} iconOnly /> },
    ]} />
);

export const DailyReportView = ({ userId, date }: { userId: string; date: string }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.daily(userId, date), queryFn: () => getDailyReport(userId, date) });
  return (
    <QueryState query={query}>
      {(r) => (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-fg-2">
            <UserAvatar userId={r.userId} showName />
            {r.confirmedAt
              ? <span className="flex items-center gap-1"><Icon name="check" size={13} className="text-success" />Plan confirmed at {formatTime(r.confirmedAt)} via {r.confirmedVia === 'TELEGRAM' ? 'Telegram' : 'Web'}</span>
              : <span className="text-warn">Daily plan not confirmed</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {GROUPS.map((g) => <Stat key={g.key} label={`${g.emoji} ${g.label}`} value={r.groups[g.key].length} color={r.groups[g.key].length ? g.color : undefined} />)}
            <Stat label="Progress" value={`${r.progress.done}/${r.progress.total}`}>
              <Progress percent={r.progress.percent} size="small" strokeColor="#165dff" />
            </Stat>
          </div>
          {GROUPS.filter((g) => r.groups[g.key].length).map((g) => (
            <Panel key={g.key} title={`${g.emoji} ${g.label} · ${r.groups[g.key].length}`} bodyClassName="!p-0">
              <TaskList items={r.groups[g.key]} />
            </Panel>
          ))}
          {!GROUPS.some((g) => r.groups[g.key].length) && <EmptyState description="No planned tasks for this day" />}
          <Panel title="Daily note">
            <p className="m-0 whitespace-pre-wrap">{r.note ?? <span className="text-fg-3">No note</span>}</p>
          </Panel>
        </div>
      )}
    </QueryState>
  );
};

export const TeamDailyReportView = ({ teamId, date }: { teamId: string; date: string }) => {
  const query = useQuery({ queryKey: QUERY_KEYS.reports.teamDaily(teamId, date), queryFn: () => getTeamDailyReport(teamId, date) });
  return (
    <QueryState query={query}>
      {(r) => (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Team progress" value={`${r.progress}%`}><Progress percent={r.progress} showInfo={false} size="small" strokeColor="#165dff" /></Stat>
            <Stat label="✅ Done / planned" value={`${r.done}/${r.planned}`} />
            <Stat label="🚧 Blockers" value={r.blockers.length} color={r.blockers.length ? '#eb5757' : undefined} />
            <Stat label="Members" value={r.rows.length} />
          </div>
          <Panel title="Members" bodyClassName="!p-0">
            <Table className="app-table" size="middle" rowKey="userId" dataSource={r.rows} pagination={false} scroll={{ x: 700 }}
              columns={[
                { title: 'Member', dataIndex: 'userId', render: (id: string) => <UserAvatar userId={id} showName /> },
                { title: 'Plan', dataIndex: 'confirmedAt', width: 150, render: (c: string | null) => c ? <span className="text-success">Confirmed {formatTime(c)}</span> : <span className="text-warn">Not confirmed</span> },
                { title: '✅ Done / planned', key: 'dp', width: 200, render: (_, row) => (
                  <span className="flex items-center gap-2"><Progress percent={row.planned ? Math.round((row.done / row.planned) * 100) : 0} size="small" showInfo={false} className="!m-0 w-20" strokeColor="#4cb782" />{row.done}/{row.planned}</span>) },
                { title: '🚧 Blocked', dataIndex: 'blocked', width: 110, render: (n: number) => <span className={n ? 'text-danger' : ''}>{n}</span> },
                { title: '🔴 Unfinished', dataIndex: 'unfinished', width: 120 },
              ]} />
          </Panel>
          {r.blockers.length > 0 && (
            <Panel title="Blockers">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {r.blockers.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 text-[13px]">
                    <UserAvatar userId={b.userId} /><span className="font-mono text-xs text-fg-3">{b.key}</span>{b.title}
                    <span className="text-xs text-danger">— {b.blockerReason}</span>
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
