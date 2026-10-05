import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon } from '@hugeicons/core-free-icons';
import { Progress, Tag } from 'antd';
import { Link } from 'react-router-dom';

import { EmptyState, Panel, QueryState, StatusIcon, UserAvatar } from '@/shared/components/ui';
import { BOARD_COLUMNS, ROUTES, TASK_STATUS } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import { formatDate, fromNow } from '@/shared/utils';

import { useProjectStats, useTopBlockers } from '../hooks/useProjects';
import { useCurrentProject } from './ProjectLayout';

export const ProjectOverviewTab = () => {
  const { data: project } = useCurrentProject();
  const stats = useProjectStats(project?.id);
  const blockers = useTopBlockers(project?.id);
  if (!project) return null;
  const sprint = project.active_sprint;
  const daysLeft = sprint ? dayjs(sprint.end_date).diff(dayjs().startOf('day'), 'day') : 0;

  return (
    <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <Panel title="About">
          <p className="m-0 mb-4 whitespace-pre-wrap text-[14px] leading-6 text-fg">{project.description || <span className="text-fg-3">No description</span>}</p>
          <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            <div><div className="text-fg-3">Start</div><div className="mt-1 text-fg">{formatDate(project.start_date)}</div></div>
            <div><div className="text-fg-3">Target</div><div className="mt-1 text-fg">{formatDate(project.end_date)}</div></div>
            <div><div className="text-fg-3">Lead</div><div className="mt-1"><UserAvatar user={project.manager} showName size={18} /></div></div>
            <div><div className="text-fg-3">Progress</div><Progress percent={project.progress ?? stats.data?.completion_percent ?? 0} size="small" strokeColor="#165dff" /></div>
          </div>
        </Panel>
        <Panel title="Tasks by status">
          <QueryState query={stats}>
            {(s) => (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[...BOARD_COLUMNS, 'cancelled' as const].map((st) => (
                  <div key={st} className="rounded-md border border-line p-3">
                    <div className="flex items-center gap-1.5 text-xs text-fg-2"><StatusIcon status={st} size={12} />{TASK_STATUS[st].label}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">{s.by_status[st] ?? 0}</div>
                  </div>
                ))}
                <div className="rounded-md border border-line p-3"><div className="text-xs text-danger">🚧 Blocked</div><div className="mt-1 text-xl font-semibold text-danger">{s.blocked}</div></div>
                <div className="rounded-md border border-line p-3"><div className="text-xs text-danger">Overdue</div><div className="mt-1 text-xl font-semibold text-danger">{s.overdue}</div></div>
              </div>
            )}
          </QueryState>
        </Panel>
      </div>
      <div className="flex flex-col gap-4">
        <Panel title="Active sprint" extra={sprint && <Link to={ROUTES.project(project.key, 'board')}>Open board</Link>}>
          {sprint ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-medium"><HugeiconsIcon icon={Rocket01Icon} size={15} className="hicon" strokeWidth={1.7} />{sprint.name}</div>
              <div className="text-xs text-fg-2">Ends {formatDate(sprint.end_date)} · <Tag color={daysLeft < 2 ? 'red' : 'default'}>{daysLeft >= 0 ? `${daysLeft} days left` : 'Past due'}</Tag></div>
            </div>
          ) : (
            <EmptyState description="No active sprint" />
          )}
        </Panel>
        <Panel title="Top blockers">
          <QueryState query={blockers} isEmpty={(d) => !d.results.length} empty={<EmptyState description="No active blockers 🎉" />}>
            {(d) => (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {d.results.map((b) => (
                  <li key={b.key} className="flex gap-2">
                    <UserAvatar user={b.assignee} />
                    <div className="min-w-0 text-[13px]">
                      <Link to={`?task=${b.key}`} className="font-mono text-xs">{b.key}</Link> <span className="text-fg">{b.title}</span>
                      <div className="text-xs text-fg-2">{b.active_blocker?.reason}</div>
                      <div className="text-[11px] text-fg-3">since {fromNow(b.active_blocker?.created_at ?? b.updated_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryState>
        </Panel>
      </div>
    </div>
  );
};
