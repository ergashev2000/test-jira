import { Progress, Table, Tag } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { DonutChart, HBarChart, Legend } from '@/modules/reports';
import { StatusDropdown, useTaskDrawer } from '@/modules/tasks';
import { useUserMap } from '@/shared/api/lookups';
import { ActivityTimeline, EmptyState, Icon, PriorityTag, UserAvatar } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import { daysFromToday, formatDate, fromNow } from '@/shared/utils';

import type { DashboardData } from '../api/dashboardApi';

export const ActiveSprintCard = ({ s }: { s: DashboardData['activeSprint'] }) => {
  if (!s) return <EmptyState description="No active sprint" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name="sprint" size={16} className="text-primary" />
        <Link to={ROUTES.project(s.projectKey, 'board')} className="font-medium !text-fg">{s.projectKey} · {s.name}</Link>
        <Tag className="!ml-auto" color={s.daysLeft <= 2 ? 'red' : 'default'}>{s.daysLeft >= 0 ? `${s.daysLeft} days left` : 'Past end date'}</Tag>
      </div>
      <p className="m-0 text-fg-2">{s.goal}</p>
      <div className="text-xs text-fg-3">{formatDate(s.startDate)} — {formatDate(s.endDate)}</div>
      <Progress percent={s.progress} strokeColor="#165dff" />
    </div>
  );
};

export const SprintProgressChart = ({ p }: { p: DashboardData['sprintProgress'] }) => {
  const total = p.completed + p.inProgress + p.todo + p.blocked;
  if (!total) return <EmptyState description="No sprint tasks" />;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  const data = [
    { name: `Completed ${pct(p.completed)}`, value: p.completed, color: '#4cb782' },
    { name: `In progress ${pct(p.inProgress)}`, value: p.inProgress, color: '#f2c94c' },
    { name: `To do ${pct(p.todo)}`, value: p.todo, color: '#165dff' },
    { name: `Blocked ${pct(p.blocked)}`, value: p.blocked, color: '#eb5757' },
  ];
  return <div className="grid grid-cols-[1fr_150px] items-center gap-3"><DonutChart data={data} height={170} center={pct(p.completed)} /><Legend data={data} /></div>;
};

export const MyTasksWidget = ({ items }: { items: DashboardData['myTasks'] }) => {
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

export const TeamTable = ({ rows }: { rows: DashboardData['team'] }) => (
  <Table className="app-table" size="small" rowKey="userId" dataSource={rows} pagination={false} scroll={{ x: 560 }}
    locale={{ emptyText: <EmptyState /> }}
    columns={[
      { title: 'User', dataIndex: 'userId', render: (id: string) => <UserAvatar userId={id} showName size={18} /> },
      { title: 'Assigned', dataIndex: 'assigned', width: 80, align: 'right' },
      { title: 'Completed', dataIndex: 'completed', width: 90, align: 'right', render: (n: number) => <span className="text-success">{n}</span> },
      { title: 'Unfinished', dataIndex: 'unfinished', width: 90, align: 'right' },
      { title: 'Blocked', dataIndex: 'blocked', width: 75, align: 'right', render: (n: number) => <span className={n ? 'text-danger' : 'text-fg-3'}>{n}</span> },
      { title: 'Overdue', dataIndex: 'overdue', width: 75, align: 'right', render: (n: number) => <span className={n ? 'text-danger' : 'text-fg-3'}>{n}</span> },
    ]} />
);

export const WorkloadChart = ({ rows }: { rows: DashboardData['workload'] }) => {
  const users = useUserMap();
  if (!rows.length) return <EmptyState description="No active tasks" />;
  return <HBarChart data={rows.map((w) => ({ name: users.get(w.userId)?.fullName ?? '—', value: w.active, color: w.active >= 10 ? '#eb5757' : '#165dff' }))} />;
};

export const BlockersTable = ({ rows }: { rows: DashboardData['blockers'] }) => {
  const { openTask } = useTaskDrawer();
  const stale = (since: string) => dayjs().diff(since, 'hour') >= 48;
  return (
    <Table className="app-table" size="small" rowKey="taskKey" dataSource={rows} pagination={false} scroll={{ x: 700 }}
      locale={{ emptyText: <EmptyState description="No active blockers 🎉" /> }}
      rowClassName={(r) => `row-clickable ${stale(r.since) ? 'row-blocker-stale' : ''}`}
      onRow={(r) => ({ onClick: () => openTask(r.taskKey) })}
      columns={[
        { title: 'Task', dataIndex: 'taskKey', render: (k: string, r) => <span><span className="font-mono text-xs text-fg-3">{k}</span> {r.title}</span> },
        { title: 'User', dataIndex: 'userId', width: 60, render: (id: string | null) => <UserAvatar userId={id} /> },
        { title: 'Project', dataIndex: 'projectKey', width: 80 },
        { title: 'Blocker reason', dataIndex: 'reason', ellipsis: true },
        { title: 'Blocked since', dataIndex: 'since', width: 140, render: (s: string) => stale(s) ? <Tag color="red">{fromNow(s)}</Tag> : <span className="text-fg-2">{fromNow(s)}</span> },
      ]} />
  );
};

export const OverdueList = ({ rows }: { rows: DashboardData['overdueTasks'] }) => {
  const { openTask } = useTaskDrawer();
  if (!rows.length) return <EmptyState description="Nothing overdue" />;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.slice(0, 8).map((t) => (
        <li key={t.key} onClick={() => openTask(t.key)} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
          <span className="w-16 font-mono text-xs text-fg-3">{t.key}</span>
          <span className="flex-1 truncate text-[13px]">{t.title}</span>
          <UserAvatar userId={t.assigneeId} />
          <span className="w-24 text-right text-xs text-danger">{Math.abs(daysFromToday(t.deadline))} days overdue</span>
        </li>
      ))}
    </ul>
  );
};

export const RecentActivity = ({ items }: { items: DashboardData['activity'] }) =>
  items.length ? <ActivityTimeline items={items} showTask /> : <EmptyState description="No activity yet" />;

export const useKpiNavigate = () => {
  const navigate = useNavigate();
  return {
    projects: () => navigate(`${ROUTES.PROJECTS}?status=ACTIVE`),
    sprints: () => navigate(`${ROUTES.SPRINTS}?status=ACTIVE`),
    tasks: () => navigate(ROUTES.BOARD),
    completed: () => navigate(`${ROUTES.MY_TASKS}?tab=completed`),
    overdue: () => navigate(`${ROUTES.BOARD}?deadline=overdue`),
    blocked: () => navigate(`${ROUTES.BOARD}?blocked=true`),
  };
};
