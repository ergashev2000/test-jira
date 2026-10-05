import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Clock01Icon, Folder01Icon, Rocket01Icon, Task01Icon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { Select, Skeleton } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { ErrorState, KpiCard, PageHeader, Panel } from '@/shared/components/ui';
import { QUERY_KEYS, REFETCH_INTERVAL, ROUTES } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import { roleOf } from '@/shared/lib/session';

import { getBlockedTasks, getDashboard, getMyTodayTasks, getOverdueTasks, type DashboardSummary } from '../api/dashboardApi';
import {
  ActiveSprintCard,
  BlockersTable,
  MyTasksWidget,
  OverdueList,
  RecentActivity,
  SprintProgressChart,
  TeamTable,
  useKpiNavigate,
  WorkloadChart,
} from '../components/Widgets';

const Widget = ({ title, extra, data, loading, className, children }: {
  title: string; extra?: ReactNode; data?: DashboardSummary; loading: boolean; className?: string; children: (d: DashboardSummary) => ReactNode;
}) => (
  <Panel title={title} extra={extra} className={className}>
    {loading || !data ? <Skeleton active paragraph={{ rows: 3 }} /> : children(data)}
  </Panel>
);

export const DashboardPage = () => {
  const { get, set } = useTableParams();
  const user = useCurrentUser();
  const projectId = get('project') ? Number(get('project')) : undefined;
  const { data: projects = [] } = useProjectLookups();
  const go = useKpiNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.dashboard(projectId?.toString()),
    queryFn: () => getDashboard(projectId),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: (p) => p,
  });
  const myTasks = useQuery({ queryKey: [...QUERY_KEYS.dashboardAll, 'my-tasks'], queryFn: getMyTodayTasks, refetchInterval: REFETCH_INTERVAL });
  const blockers = useQuery({ queryKey: [...QUERY_KEYS.dashboard(projectId?.toString()), 'blockers'], queryFn: () => getBlockedTasks(projectId), refetchInterval: REFETCH_INTERVAL });
  const overdue = useQuery({ queryKey: [...QUERY_KEYS.dashboard(projectId?.toString()), 'overdue'], queryFn: () => getOverdueTasks(projectId), refetchInterval: REFETCH_INTERVAL });

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const k = data?.kpi;
  const role = roleOf(user);
  const scope = role === 'PROJECT_MANAGER' ? 'Your projects' : role === 'TEAM_LEAD' ? 'Your team' : 'All projects';

  return (
    <>
      <PageHeader title="Dashboard" extra={
        <>
          <span className="text-xs text-fg-3">{scope}</span>
          <Select size="small" className="min-w-52" value={projectId ?? 'all'} onChange={(v: number | 'all') => set({ project: v === 'all' ? undefined : v })}
            options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id as number | 'all', label: p.name }))]} />
        </>
      } />
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={Folder01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Active projects" color='var(--c-fg)' value={k?.active_projects ?? 0}  onClick={go.projects} />
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={Rocket01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Active sprints" color='var(--c-fg)' value={k?.active_sprints ?? 0} onClick={go.sprints} />
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={Task01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Total tasks" color='var(--c-fg)' value={k?.total_tasks ?? 0} onClick={go.tasks} />
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Completed today"  value={k?.completed_today ?? 0} color="var(--c-success)" onClick={go.completed} />
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={Clock01Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Overdue tasks" value={k?.overdue ?? 0} color="var(--c-danger)" onClick={go.overdue} />
          <KpiCard loading={isLoading} icon={<HugeiconsIcon icon={Alert02Icon} size={14} className="hicon" strokeWidth={1.7} />} title="Blocked tasks" value={k?.blocked ?? 0} color="var(--c-warn)" onClick={go.blocked} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Widget title="Active sprint" data={data} loading={isLoading}>{(d) => <ActiveSprintCard s={d.active_sprint} />}</Widget>
          <Widget title="Sprint progress" data={data} loading={isLoading}>{(d) => <SprintProgressChart p={d.sprint_progress} />}</Widget>
          <Panel title="My tasks today" extra={<Link to={ROUTES.MY_TASKS}>View all</Link>}>
            {myTasks.isLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : <MyTasksWidget items={myTasks.data ?? []} />}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
          <Widget title="Team performance" data={data} loading={isLoading}>{(d) => <TeamTable rows={d.team} />}</Widget>
          <Widget title="Workload · active tasks" data={data} loading={isLoading}>{(d) => <WorkloadChart rows={d.workload} />}</Widget>
        </div>

        <Panel title="Active blockers" extra={<span className="text-fg-3">Highlighted: unresolved for 48h+</span>}>
          {blockers.isLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : <BlockersTable rows={blockers.data ?? []} />}
        </Panel>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel title="Overdue tasks">{overdue.isLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : <OverdueList rows={overdue.data ?? []} />}</Panel>
          <Widget title="Recent activity" data={data} loading={isLoading}>{(d) => <RecentActivity items={d.activity} />}</Widget>
        </div>
      </div>
    </>
  );
};
