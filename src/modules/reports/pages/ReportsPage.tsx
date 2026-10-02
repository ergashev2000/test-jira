import { HugeiconsIcon } from '@hugeicons/react';
import { PrinterIcon } from '@hugeicons/core-free-icons';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Segmented, Select } from 'antd';

import { useCurrentProject } from '@/modules/projects';
import { fetchSprintLookups, useProjectLookups, useTeamLookups } from '@/shared/api/lookups';
import { EmptyState, PageHeader, UserSelect } from '@/shared/components/ui';
import { hasPermission, type Permission } from '@/shared/constants';
import { useCurrentUser, useTableParams } from '@/shared/hooks';
import dayjs from '@/shared/lib/dayjs';
import { useSessionStore } from '@/shared/lib/session';

import { DailyReportView, TeamDailyReportView } from '../components/DailyReports';
import { ProjectReportView, SprintReportView } from '../components/ProjectReports';

type ReportType = 'daily' | 'team-daily' | 'sprint' | 'project';
const TYPES: { value: ReportType; label: string; permission: Permission }[] = [
  { value: 'daily', label: 'Daily', permission: 'report.view' },
  { value: 'team-daily', label: 'Team Daily', permission: 'report.teamDaily' },
  { value: 'sprint', label: 'Sprint', permission: 'report.sprint' },
  { value: 'project', label: 'Project', permission: 'report.project' },
];

export const ReportsPage = () => {
  const { get, set } = useTableParams();
  const user = useCurrentUser();
  const { data: teams = [] } = useTeamLookups();
  const { data: projects = [] } = useProjectLookups();
  const allowed = TYPES.filter((t) => hasPermission(user.role, t.permission));
  const type = allowed.find((t) => t.value === get('type'))?.value ?? 'daily';
  const date = get('date') ?? dayjs().format('YYYY-MM-DD');
  const canPickUser = hasPermission(user.role, 'report.daily.all') || user.role === 'TEAM_LEAD';
  const myTeams = teams.filter((t) => hasPermission(user.role, 'report.daily.all') || t.leadId === user.id);
  const userId = canPickUser ? (get('userId') ?? user.id) : user.id;
  const teamId = get('teamId') ?? myTeams[0]?.id;
  const projectId = get('projectId') ?? projects.find((p) => p.status === 'ACTIVE')?.id;
  const sprints = useQuery({ queryKey: ['sprints', 'lookup', projectId], queryFn: () => fetchSprintLookups(projectId), enabled: type === 'sprint' && !!projectId });
  const sprintList = (sprints.data ?? []).filter((s) => s.status !== 'CANCELLED');
  const sprintId = get('sprintId') ?? (sprintList.find((s) => s.status === 'ACTIVE') ?? sprintList[0])?.id;
  const teamLeadMembers = user.role === 'TEAM_LEAD' ? myTeams.flatMap((t) => t.memberIds) : undefined;

  const datePicker = (
    <DatePicker size="small" format="DD.MM.YYYY" allowClear={false} value={dayjs(date)} disabledDate={(d) => d.isAfter(dayjs(), 'day')}
      onChange={(d) => set({ date: d?.format('YYYY-MM-DD') }, false)} />
  );
  const projectSelect = (
    <Select size="small" className="min-w-52" value={projectId} placeholder="Project" onChange={(v: string) => set({ projectId: v, sprintId: undefined }, false)}
      options={projects.map((p) => ({ value: p.id, label: p.name }))} />
  );

  return (
    <>
      <PageHeader title="Reports" extra={<Button size="small" className="no-print" icon={<HugeiconsIcon icon={PrinterIcon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => window.print()}>Print</Button>}>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Segmented size="small" value={type} options={allowed.map(({ value, label }) => ({ value, label }))}
            onChange={(v) => set({ type: v, userId: undefined, teamId: undefined, sprintId: undefined })} />
          <span className="mx-1 h-4 w-px bg-line" />
          {type === 'daily' && (
            <>
              <UserSelect size="small" className="min-w-52" value={userId} disabled={!canPickUser} allowClear={false}
                allowIds={teamLeadMembers} onlyActive={false}
                onChange={(v) => set({ userId: v as string }, false)} />
              {datePicker}
            </>
          )}
          {type === 'team-daily' && (
            <>
              <Select size="small" className="min-w-40" value={teamId} placeholder="Team" onChange={(v: string) => set({ teamId: v }, false)}
                options={myTeams.map((t) => ({ value: t.id, label: t.name }))} />
              {datePicker}
            </>
          )}
          {type === 'sprint' && (
            <>
              {projectSelect}
              <Select size="small" className="min-w-40" value={sprintId} placeholder="Sprint" loading={sprints.isLoading}
                onChange={(v: string) => set({ sprintId: v }, false)} options={sprintList.map((s) => ({ value: s.id, label: `${s.name} · ${s.status.toLowerCase()}` }))} />
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
  const role = useSessionStore((s) => s.user?.role);
  if (!project) return null;
  if (!hasPermission(role, 'report.project')) return <EmptyState description="Project reports are available to managers" />;
  return <div className="p-5"><ProjectReportView projectId={project.id} /></div>;
};
