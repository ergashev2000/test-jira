import { useQuery } from '@tanstack/react-query';
import { Select, Skeleton } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { ErrorState, Icon, KpiCard, PageHeader, Panel } from '@/shared/components/ui';
import { QUERY_KEYS, REFETCH_INTERVAL, ROUTES } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import { useSessionStore } from '@/shared/lib/session';

import { getDashboard, type DashboardData } from '../api/dashboardApi';
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
  title: string; extra?: ReactNode; data?: DashboardData; loading: boolean; className?: string; children: (d: DashboardData) => ReactNode;
}) => (
  <Panel title={title} extra={extra} className={className}>
    {loading || !data ? <Skeleton active paragraph={{ rows: 3 }} /> : children(data)}
  </Panel>
);

export const DashboardPage = () => {
  const { get, set } = useTableParams();
  const user = useSessionStore((s) => s.user)!;
  const projectId = get('projectId');
  const { data: projects = [] } = useProjectLookups();
  const go = useKpiNavigate();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.dashboard(projectId),
    queryFn: () => getDashboard(projectId),
    refetchInterval: REFETCH_INTERVAL,
    placeholderData: (p) => p,
  });

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const k = data?.kpi;
  const scope = user.role === 'PROJECT_MANAGER' ? 'Your projects' : user.role === 'TEAM_LEAD' ? 'Your team' : 'All projects';

  return (
    <>
      <PageHeader title="Dashboard" extra={
        <>
          <span className="text-xs text-fg-3">{scope}</span>
          <Select size="small" className="min-w-52" value={projectId ?? 'all'} onChange={(v: string) => set({ projectId: v === 'all' ? undefined : v })}
            options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
        </>
      } />
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard loading={isLoading} icon={<Icon name="projects" size={14} />} title="Active projects" value={k?.activeProjects ?? 0} onClick={go.projects} />
          <KpiCard loading={isLoading} icon={<Icon name="sprint" size={14} />} title="Active sprints" value={k?.activeSprints ?? 0} onClick={go.sprints} />
          <KpiCard loading={isLoading} icon={<Icon name="task" size={14} />} title="Total tasks" value={k?.totalTasks ?? 0} onClick={go.tasks} />
          <KpiCard loading={isLoading} icon={<Icon name="check" size={14} />} title="Completed today" value={k?.completedToday ?? 0} color="#4cb782" onClick={go.completed} />
          <KpiCard loading={isLoading} icon={<Icon name="clock" size={14} />} title="Overdue tasks" value={k?.overdue ?? 0} color="#eb5757" onClick={go.overdue} />
          <KpiCard loading={isLoading} icon={<Icon name="alert" size={14} />} title="Blocked tasks" value={k?.blocked ?? 0} color="#f2994a" onClick={go.blocked} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Widget title="Active sprint" data={data} loading={isLoading}>{(d) => <ActiveSprintCard s={d.activeSprint} />}</Widget>
          <Widget title="Sprint progress" data={data} loading={isLoading}>{(d) => <SprintProgressChart p={d.sprintProgress} />}</Widget>
          <Widget title="My tasks today" data={data} loading={isLoading} extra={<Link to={ROUTES.MY_TASKS}>View all</Link>}>
            {(d) => <MyTasksWidget items={d.myTasks} />}
          </Widget>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_2fr]">
          <Widget title="Team performance" data={data} loading={isLoading}>{(d) => <TeamTable rows={d.team} />}</Widget>
          <Widget title="Workload · active tasks" data={data} loading={isLoading}>{(d) => <WorkloadChart rows={d.workload} />}</Widget>
        </div>

        <Widget title="Active blockers" data={data} loading={isLoading} extra={<span className="text-fg-3">Highlighted: unresolved for 48h+</span>}>
          {(d) => <BlockersTable rows={d.blockers} />}
        </Widget>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Widget title="Overdue tasks" data={data} loading={isLoading}>{(d) => <OverdueList rows={d.overdueTasks} />}</Widget>
          <Widget title="Recent activity" data={data} loading={isLoading}>{(d) => <RecentActivity items={d.activity} />}</Widget>
        </div>
      </div>
    </>
  );
};
