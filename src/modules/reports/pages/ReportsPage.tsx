import { HugeiconsIcon } from '@hugeicons/react';
import { PrinterIcon } from '@hugeicons/core-free-icons';
import { Button, DatePicker, Segmented, Select } from 'antd';

import { useCurrentProject } from '@/modules/projects';
import { useProjectLookups, useSprintLookups, useTeamLookups } from '@/shared/api/lookups';
import { EmptyState, PageHeader, UserSelect } from '@/shared/components/ui';
import { hasPermission, type Permission } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import dayjs from '@/shared/lib/dayjs';
import { roleOf, useSessionStore } from '@/shared/lib/session';

import { DailyReportView, TeamDailyReportView } from '../components/DailyReports';
import { ProjectReportView, SprintReportView } from '../components/ProjectReports';

type ReportType = 'daily' | 'team-daily' | 'sprint' | 'project';
const TYPES: { value: ReportType; label: string; permission: Permission }[] = [
  { value: 'daily', label: 'Daily', permission: 'report.view' },
  { value: 'team-daily', label: 'Team Daily', permission: 'report.teamDaily' },
  { value: 'sprint', label: 'Sprint', permission: 'report.sprint' },
  { value: 'project', label: 'Project', permission: 'report.project' },
];

const num = (v: string | undefined) => (v ? Number(v) : undefined);

export const ReportsPage = () => {
  const { get, set } = useTableParams();
  const user = useCurrentUser();
  const role = roleOf(user);
  const { data: teams = [] } = useTeamLookups();
  const { data: projects = [] } = useProjectLookups();
  const allowed = TYPES.filter((t) => hasPermission(role, t.permission));
  const type = allowed.find((t) => t.value === get('type'))?.value ?? 'daily';
  const date = get('date') ?? dayjs().format('YYYY-MM-DD');
  const seesAll = hasPermission(role, 'report.daily.all');
  const canPickUser = seesAll || role === 'TEAM_LEAD';
  const myTeams = teams.filter((t) => seesAll || t.lead?.id === user.id);
  // No user picked → own report via GET /me/daily-report/.
  const userId = canPickUser ? num(get('user')) : undefined;
  const teamId = num(get('team')) ?? myTeams[0]?.id;
  const projectId = num(get('project')) ?? projects.find((p) => p.status === 'active')?.id;
  const sprints = useSprintLookups(type === 'sprint' ? projectId : undefined, ['active', 'planned', 'completed']);
  const sprintList = sprints.data ?? [];
  const sprintId = num(get('sprint')) ?? (sprintList.find((s) => s.status === 'active') ?? sprintList[0])?.id;

  const datePicker = (
    <DatePicker size="small" format="DD.MM.YYYY" allowClear={false} value={dayjs(date)} disabledDate={(d) => d.isAfter(dayjs(), 'day')}
      onChange={(d) => set({ date: d?.format('YYYY-MM-DD') }, false)} />
  );
  const projectSelect = (
    <Select size="small" className="min-w-52" value={projectId} placeholder="Project" onChange={(v: number) => set({ project: v, sprint: undefined }, false)}
      options={projects.map((p) => ({ value: p.id, label: p.name }))} />
  );

  return (
    <>
      <PageHeader title="Reports" extra={<Button size="small" className="no-print" icon={<HugeiconsIcon icon={PrinterIcon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => window.print()}>Print</Button>}>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Segmented size="small" value={type} options={allowed.map(({ value, label }) => ({ value, label }))}
            onChange={(v) => set({ type: v, user: undefined, team: undefined, sprint: undefined })} />
          <span className="mx-1 h-4 w-px bg-line" />
          {type === 'daily' && (
            <>
              <UserSelect size="small" className="min-w-52" value={userId ?? user.id} disabled={!canPickUser} allowClear={false}
                teamId={seesAll ? undefined : myTeams[0]?.id} onlyActive={false} initial={[user]}
                onChange={(v) => set({ user: v === user.id ? undefined : (v as number) }, false)} />
              {datePicker}
            </>
          )}
          {type === 'team-daily' && (
            <>
              <Select size="small" className="min-w-40" value={teamId} placeholder="Team" onChange={(v: number) => set({ team: v }, false)}
                options={myTeams.map((t) => ({ value: t.id, label: t.name }))} />
              {datePicker}
            </>
          )}
          {type === 'sprint' && (
            <>
              {projectSelect}
              <Select size="small" className="min-w-40" value={sprintId} placeholder="Sprint" loading={sprints.isLoading}
                onChange={(v: number) => set({ sprint: v }, false)} options={sprintList.map((s) => ({ value: s.id, label: `${s.name} · ${s.status}` }))} />
            </>
          )}
          {type === 'project' && projectSelect}
        </div>
      </PageHeader>
      <div className="p-5">
        {type === 'daily' && <DailyReportView userId={userId} date={date} />}
        {type === 'team-daily' && (teamId ? <TeamDailyReportView teamId={teamId} date={date} /> : <EmptyState description="You don't lead any team" />)}
        {type === 'sprint' && (sprintId ? <SprintReportView sprintId={sprintId} /> : <EmptyState description="No sprints in this project" />)}
        {type === 'project' && (projectId ? <ProjectReportView projectId={projectId} /> : <EmptyState description="No projects" />)}
      </div>
    </>
  );
};

/** Project → Reports tab. */
export const ProjectReportsTab = () => {
  const { data: project } = useCurrentProject();
  const role = useSessionStore((s) => roleOf(s.user));
  if (!project) return null;
  if (!hasPermission(role, 'report.project')) return <EmptyState description="Project reports are available to managers" />;
  return <div className="p-5"><ProjectReportView projectId={project.id} /></div>;
};
