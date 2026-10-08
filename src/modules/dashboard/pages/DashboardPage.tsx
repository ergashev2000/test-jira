import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Clock01Icon, Folder01Icon, Rocket01Icon, Task01Icon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import { Link } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { ErrorState, KpiCard, PageHeader, Panel, QueryState } from '@/shared/components/ui';
import { REFETCH_INTERVAL, ROUTES } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import { roleOf } from '@/shared/lib/session';

import { getDashboardActivity, getDashboardBlockers, getDashboardKpi, getDashboardOverdue, getDashboardTeam, getDashboardWorkload, getMyTodayTasks, getSprintProgress } from '../api/dashboardApi';
import { BlockersTable, MyTasksWidget, OverdueList, RecentActivity, SprintProgressCards, TeamTable, useKpiNavigate, WorkloadChart } from '../components/Widgets';

export const DashboardPage = () => {
  const { get, set } = useTableParams();
  const user = useCurrentUser();
  const projectId = get('project') ? Number(get('project')) : undefined;
  const { data: projects = [] } = useProjectLookups();
  const go = useKpiNavigate();
  const options = { refetchInterval: REFETCH_INTERVAL };
  const kpi = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'kpi'], queryFn: () => getDashboardKpi(projectId), ...options });
  const sprints = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'sprints'], queryFn: () => getSprintProgress(projectId), ...options });
  const team = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'team'], queryFn: () => getDashboardTeam(projectId), ...options });
  const workload = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'workload'], queryFn: () => getDashboardWorkload(projectId), ...options });
  const blockers = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'blockers'], queryFn: () => getDashboardBlockers(projectId), ...options });
  const overdue = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'overdue'], queryFn: () => getDashboardOverdue(projectId), ...options });
  const activity = useQuery({ queryKey: ['dashboard', projectId ?? 'all', 'activity'], queryFn: () => getDashboardActivity(projectId), ...options });
  const myTasks = useQuery({ queryKey: ['dashboard', 'my-tasks', 'today'], queryFn: getMyTodayTasks, ...options });
  const role = roleOf(user);
  const scope = role === 'PROJECT_MANAGER' ? 'Your projects' : role === 'TEAM_LEAD' ? 'Your team' : 'All projects';
  const data = kpi.data;

  return <><PageHeader title="Dashboard" extra={<><span className="text-xs text-fg-3">{scope}</span><Select size="small" className="min-w-52" value={projectId ?? 'all'} onChange={(value: number | 'all') => set({ project: value === 'all' ? undefined : value })} options={[{ value: 'all', label: 'All projects' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} /></>} />
    <div className="flex flex-col gap-4 p-5">
      {kpi.isError ? <Panel><ErrorState error={kpi.error} onRetry={() => void kpi.refetch()} /></Panel> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={Folder01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Active projects" color="var(--c-fg)" value={data?.active_projects ?? 0} onClick={go.projects} />
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={Rocket01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Active sprints" color="var(--c-fg)" value={data?.active_sprints ?? 0} onClick={go.sprints} />
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={Task01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Total tasks" color="var(--c-fg)" value={data?.total_tasks ?? 0} onClick={go.tasks} />
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Completed today" value={data?.completed_today ?? 0} color="var(--c-success)" onClick={go.completed} />
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={Clock01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Overdue tasks" value={data?.overdue_tasks ?? 0} color="var(--c-danger)" onClick={go.overdue} />
        <KpiCard loading={kpi.isLoading} icon={<HugeiconsIcon icon={Alert02Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Blocked tasks" value={data?.blocked_tasks ?? 0} color="var(--c-warn)" onClick={go.blocked} />
      </div>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><Panel title="Sprint progress" className="lg:col-span-2"><QueryState query={sprints} isEmpty={(items) => !items.length}>{(items) => <SprintProgressCards items={items} />}</QueryState></Panel><Panel title="My tasks today" extra={<Link to={ROUTES.MY_TASKS}>View all</Link>}><QueryState query={myTasks} isEmpty={(items) => !items.length}>{(items) => <MyTasksWidget items={items} />}</QueryState></Panel></div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]"><Panel title="Team performance"><QueryState query={team} isEmpty={(rows) => !rows.length}>{(rows) => <TeamTable rows={rows} />}</QueryState></Panel><Panel title="Workload · active tasks"><QueryState query={workload} isEmpty={(rows) => !rows.length}>{(rows) => <WorkloadChart rows={rows} />}</QueryState></Panel></div>
      <Panel title="Active blockers" extra={<span className="text-fg-3">Highlighted: unresolved for 48h+</span>}><QueryState query={blockers} isEmpty={(rows) => !rows.length}>{(rows) => <BlockersTable rows={rows} />}</QueryState></Panel>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><Panel title="Overdue tasks"><QueryState query={overdue} isEmpty={(page) => !page.results.length}>{(page) => <OverdueList rows={page.results} />}</QueryState></Panel><Panel title="Recent activity"><QueryState query={activity} isEmpty={(page) => !page.results.length}>{(page) => <RecentActivity items={page.results} />}</QueryState></Panel></div>
    </div>
  </>;
};
