import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon } from '@hugeicons/core-free-icons';
import { Progress, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';

import { DonutChart, HBarChart, Legend } from '@/modules/reports';
import { StatusDropdown, useTaskDrawer, type Task } from '@/modules/tasks';
import { ActivityTimeline, EmptyState, PriorityTag, UserAvatar } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import type { UserBrief } from '@/shared/types';
import { daysFromToday, formatDate, fromNow } from '@/shared/utils';

import type { DashboardActivity, DashboardBlocker, DashboardSprintProgress, DashboardTeamRow, DashboardWorkloadRow } from '../api/dashboardApi';

const groupsOf = (sprint: DashboardSprintProgress) => sprint.groups ?? { todo: (sprint.by_status.backlog ?? 0) + (sprint.by_status.todo ?? 0), in_progress: (sprint.by_status.in_progress ?? 0) + (sprint.by_status.review ?? 0) + (sprint.by_status.ready_for_testing ?? 0), done: sprint.by_status.done ?? 0 };

export const SprintProgressCards = ({ items }: { items: DashboardSprintProgress[] }) => {
  if (!items.length) return <EmptyState description="No active sprints" />;
  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{items.map((sprint) => {
    const groups = groupsOf(sprint); const percent = sprint.completion_percent ?? sprint.completed_percent;
    const chart = [{ name: 'Completed', value: groups.done, color: 'var(--c-success)' }, { name: 'In progress', value: groups.in_progress, color: 'var(--c-warn)' }, { name: 'To do', value: groups.todo, color: 'var(--c-primary)' }];
    return <div key={sprint.sprint.id} className="rounded-lg border border-line bg-surface-2 p-4"><div className="flex items-start gap-2"><HugeiconsIcon icon={Rocket01Icon} size={16} className="mt-0.5 shrink-0 hicon text-primary" strokeWidth={1.7} /><div className="min-w-0 flex-1"><div className="font-medium text-fg">{sprint.sprint.project.key} · {sprint.sprint.name}</div><p className="mb-0 mt-1 text-xs text-fg-2">{sprint.sprint.goal}</p></div><Tag color={sprint.sprint.days_left <= 2 ? 'red' : 'default'}>{sprint.sprint.days_left >= 0 ? `${sprint.sprint.days_left} days left` : 'Past end date'}</Tag></div><div className="mt-3 text-xs text-fg-3">{formatDate(sprint.sprint.start_date)} — {formatDate(sprint.sprint.end_date)} · {sprint.total} tasks</div><Progress className="mt-3" percent={percent} strokeColor="var(--c-primary)" /><div className="mt-2 grid grid-cols-[1fr_145px] items-center gap-3"><DonutChart data={chart} height={140} center={`${percent}%`} /><Legend data={chart} /></div>{(sprint.blocked > 0 || sprint.overdue > 0) && <div className="mt-2 flex gap-2 text-xs">{sprint.blocked > 0 && <span className="rounded bg-danger/10 px-2 py-1 text-danger">{sprint.blocked} blocked</span>}{sprint.overdue > 0 && <span className="rounded bg-warn/10 px-2 py-1 text-warn">{sprint.overdue} overdue</span>}</div>}</div>;
  })}</div>;
};

export const MyTasksWidget = ({ items }: { items: Task[] }) => {
  const { openTask } = useTaskDrawer();
  if (!items.length) return <EmptyState description="Nothing for today" />;
  return <ul className="m-0 flex list-none flex-col p-0">{items.map((task) => <li key={task.id} onClick={() => openTask(task.id)} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"><PriorityTag priority={task.priority} iconOnly /><span className="w-16 font-mono text-xs text-fg-3">{task.key}</span><span className="flex-1 truncate text-[13px]">{task.title}</span><StatusDropdown task={task} /></li>)}</ul>;
};

export const TeamTable = ({ rows }: { rows: DashboardTeamRow[] }) => <Table className="app-table" size="small" rowKey={(row) => row.user.id} dataSource={rows} pagination={false} scroll={{ x: 560 }} locale={{ emptyText: <EmptyState /> }} columns={[{ title: 'User', dataIndex: 'user', render: (user: UserBrief) => <UserAvatar user={user} showName size={18} /> }, { title: 'Assigned', dataIndex: 'assigned', width: 80, align: 'right' }, { title: 'Completed', dataIndex: 'completed', width: 90, align: 'right', render: (value: number) => <span className="text-success">{value}</span> }, { title: 'Unfinished', dataIndex: 'unfinished', width: 90, align: 'right' }, { title: 'Blocked', dataIndex: 'blocked', width: 75, align: 'right', render: (value: number) => <span className={value ? 'text-danger' : 'text-fg-3'}>{value}</span> }, { title: 'Overdue', dataIndex: 'overdue', width: 75, align: 'right', render: (value: number) => <span className={value ? 'text-danger' : 'text-fg-3'}>{value}</span> }]} />;
export const WorkloadChart = ({ rows }: { rows: DashboardWorkloadRow[] }) => rows.length ? <HBarChart data={rows.map((row) => ({ name: row.user.full_name, value: row.active_tasks, color: row.blocked ? 'var(--c-warn)' : 'var(--c-primary)' }))} /> : <EmptyState description="No active tasks" />;

export const BlockersTable = ({ rows }: { rows: DashboardBlocker[] }) => {
  const { openTask } = useTaskDrawer();
  return <Table className="app-table" size="small" rowKey="id" dataSource={rows} pagination={false} scroll={{ x: 700 }} locale={{ emptyText: <EmptyState description="No active blockers 🎉" /> }} rowClassName={(row) => `row-clickable ${row.is_stale ? 'row-blocker-stale' : ''}`} onRow={(row) => ({ onClick: () => openTask(row.task.id) })} columns={[{ title: 'Task', dataIndex: 'task', render: (task: DashboardBlocker['task']) => <span><span className="font-mono text-xs text-fg-3">{task.key}</span> {task.title}</span> }, { title: 'User', dataIndex: 'user', width: 60, render: (user: UserBrief | null) => <UserAvatar user={user} /> }, { title: 'Project', dataIndex: 'project', width: 80, render: (project: DashboardBlocker['project']) => project.key }, { title: 'Blocker reason', dataIndex: 'reason', ellipsis: true }, { title: 'Blocked since', dataIndex: 'blocked_since', width: 140, render: (since: string, row: DashboardBlocker) => row.is_stale ? <Tag color="red">{fromNow(since)}</Tag> : <span className="text-fg-2">{fromNow(since)}</span> }]} />;
};

export const OverdueList = ({ rows }: { rows: Task[] }) => { const { openTask } = useTaskDrawer(); if (!rows.length) return <EmptyState description="Nothing overdue" />; return <ul className="m-0 flex list-none flex-col p-0">{rows.map((task) => <li key={task.id} onClick={() => openTask(task.id)} className="-mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"><span className="w-16 font-mono text-xs text-fg-3">{task.key}</span><span className="flex-1 truncate text-[13px]">{task.title}</span><UserAvatar user={task.assignee} /><span className="w-24 text-right text-xs text-danger">{task.deadline ? Math.abs(daysFromToday(task.deadline)) : 0} days overdue</span></li>)}</ul>; };
export const RecentActivity = ({ items }: { items: DashboardActivity[] }) => items.length ? <ActivityTimeline items={items} showTask /> : <EmptyState description="No activity yet" />;
export const useKpiNavigate = () => { const navigate = useNavigate(); return { projects: () => navigate(`${ROUTES.PROJECTS}?status=active`), sprints: () => navigate(`${ROUTES.SPRINTS}?status=active`), tasks: () => navigate(ROUTES.BOARD), completed: () => navigate(`${ROUTES.MY_TASKS}?tab=completed`), overdue: () => navigate(`${ROUTES.BOARD}?deadline=overdue`), blocked: () => navigate(`${ROUTES.BOARD}?blocked=true`) }; };
