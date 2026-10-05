import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon } from '@hugeicons/core-free-icons';
import { Progress, Table, Tag } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { DonutChart, HBarChart, Legend } from '@/modules/reports';
import { StatusDropdown, useTaskDrawer, type Task } from '@/modules/tasks';
import { ActivityTimeline, EmptyState, PriorityTag, UserAvatar } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type { UserBrief } from '@/shared/types';
import { daysFromToday, formatDate, fromNow } from '@/shared/utils';

import type { DashboardSummary } from '../api/dashboardApi';

export const ActiveSprintCard = ({ s }: { s: DashboardSummary['active_sprint'] }) => {
  if (!s) return <EmptyState description="No active sprint" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Rocket01Icon} size={16} className="hicon text-primary" strokeWidth={1.7} />
        <Link to={ROUTES.project(s.project.key, 'board')} className="font-medium !text-fg">{s.project.key} · {s.name}</Link>
        <Tag className="!ml-auto" color={s.days_left <= 2 ? 'red' : 'default'}>{s.days_left >= 0 ? `${s.days_left} days left` : 'Past end date'}</Tag>
      </div>
      <p className="m-0 text-fg-2">{s.goal}</p>
      <div className="text-xs text-fg-3">{formatDate(s.start_date)} — {formatDate(s.end_date)}</div>
      <Progress percent={s.progress} strokeColor="#165dff" />
    </div>
  );
};

export const SprintProgressChart = ({ p }: { p: DashboardSummary['sprint_progress'] }) => {
  const total = p.completed + p.in_progress + p.todo + p.blocked;
  if (!total) return <EmptyState description="No sprint tasks" />;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  const data = [
    { name: `Completed ${pct(p.completed)}`, value: p.completed, color: '#4cb782' },
    { name: `In progress ${pct(p.in_progress)}`, value: p.in_progress, color: '#f2c94c' },
    { name: `To do ${pct(p.todo)}`, value: p.todo, color: '#165dff' },
    { name: `Blocked ${pct(p.blocked)}`, value: p.blocked, color: '#eb5757' },
  ];
  return <div className="grid grid-cols-[1fr_150px] items-center gap-3"><DonutChart data={data} height={170} center={pct(p.completed)} /><Legend data={data} /></div>;
};

export const MyTasksWidget = ({ items }: { items: Task[] }) => {
  const { openTask } = useTaskDrawer();
  if (!items.length) return <EmptyState description="Nothing for today" />;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {items.map((t) => (
        <li key={t.id} onClick={() => openTask(t.key)} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
          <PriorityTag priority={t.priority} iconOnly />
          <span className="w-16 font-mono text-xs text-fg-3">{t.key}</span>
          <span className="flex-1 truncate text-[13px]">{t.title}</span>
          <StatusDropdown task={t} />
        </li>
      ))}
    </ul>
  );
};

export const TeamTable = ({ rows }: { rows: DashboardSummary['team'] }) => (
  <Table className="app-table" size="small" rowKey={(r) => r.user.id} dataSource={rows} pagination={false} scroll={{ x: 560 }}
    locale={{ emptyText: <EmptyState /> }}
    columns={[
      { title: 'User', dataIndex: 'user', render: (u: UserBrief) => <UserAvatar user={u} showName size={18} /> },
      { title: 'Assigned', dataIndex: 'assigned', width: 80, align: 'right' },
      { title: 'Completed', dataIndex: 'completed', width: 90, align: 'right', render: (n: number) => <span className="text-success">{n}</span> },
      { title: 'Unfinished', dataIndex: 'unfinished', width: 90, align: 'right' },
      { title: 'Blocked', dataIndex: 'blocked', width: 75, align: 'right', render: (n: number) => <span className={n ? 'text-danger' : 'text-fg-3'}>{n}</span> },
      { title: 'Overdue', dataIndex: 'overdue', width: 75, align: 'right', render: (n: number) => <span className={n ? 'text-danger' : 'text-fg-3'}>{n}</span> },
    ]} />
);

export const WorkloadChart = ({ rows }: { rows: DashboardSummary['workload'] }) => {
  if (!rows.length) return <EmptyState description="No active tasks" />;
  return <HBarChart data={rows.map((w) => ({ name: w.user.full_name, value: w.active, color: w.active >= 10 ? '#eb5757' : '#165dff' }))} />;
};

export const BlockersTable = ({ rows }: { rows: Task[] }) => {
  const { openTask } = useTaskDrawer();
  const since = (t: Task) => t.active_blocker?.created_at ?? t.updated_at;
  const stale = (t: Task) => dayjs().diff(since(t), 'hour') >= 48;
  return (
    <Table className="app-table" size="small" rowKey="id" dataSource={rows} pagination={false} scroll={{ x: 700 }}
      locale={{ emptyText: <EmptyState description="No active blockers 🎉" /> }}
      rowClassName={(r) => `row-clickable ${stale(r) ? 'row-blocker-stale' : ''}`}
      onRow={(r) => ({ onClick: () => openTask(r.key) })}
      columns={[
        { title: 'Task', dataIndex: 'key', render: (k: string, r) => <span><span className="font-mono text-xs text-fg-3">{k}</span> {r.title}</span> },
        { title: 'User', dataIndex: 'assignee', width: 60, render: (u: UserBrief | null) => <UserAvatar user={u} /> },
        { title: 'Project', key: 'project', width: 80, render: (_, r) => r.project.key },
        { title: 'Blocker reason', key: 'reason', ellipsis: true, render: (_, r) => r.active_blocker?.reason ?? '—' },
        { title: 'Blocked since', key: 'since', width: 140, render: (_, r) => stale(r) ? <Tag color="red">{fromNow(since(r))}</Tag> : <span className="text-fg-2">{fromNow(since(r))}</span> },
      ]} />
  );
};

export const OverdueList = ({ rows }: { rows: Task[] }) => {
  const { openTask } = useTaskDrawer();
  if (!rows.length) return <EmptyState description="Nothing overdue" />;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((t) => (
        <li key={t.key} onClick={() => openTask(t.key)} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
          <span className="w-16 font-mono text-xs text-fg-3">{t.key}</span>
          <span className="flex-1 truncate text-[13px]">{t.title}</span>
          <UserAvatar user={t.assignee} />
          <span className="w-24 text-right text-xs text-danger">{t.deadline ? Math.abs(daysFromToday(t.deadline)) : 0} days overdue</span>
        </li>
      ))}
    </ul>
  );
};

export const RecentActivity = ({ items }: { items: DashboardSummary['activity'] }) =>
  items.length ? <ActivityTimeline items={items} showTask /> : <EmptyState description="No activity yet" />;

export const useKpiNavigate = () => {
  const navigate = useNavigate();
  return {
    projects: () => navigate(`${ROUTES.PROJECTS}?status=active`),
    sprints: () => navigate(`${ROUTES.SPRINTS}?status=active`),
    tasks: () => navigate(ROUTES.BOARD),
    completed: () => navigate(`${ROUTES.MY_TASKS}?tab=completed`),
    overdue: () => navigate(`${ROUTES.BOARD}?deadline=overdue`),
    blocked: () => navigate(`${ROUTES.BOARD}?blocked=true`),
  };
};
