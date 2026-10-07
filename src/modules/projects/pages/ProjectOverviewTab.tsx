import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon } from '@hugeicons/core-free-icons';
import { Progress, Tag } from 'antd';
import { Link } from 'react-router-dom';

import { EmptyState, Panel, QueryState, StatusIcon, UserAvatar } from '@/shared/components/ui';
import { BOARD_COLUMNS, ROUTES, TASK_STATUS } from '@/shared/constants';
import type { ProjectOverview } from '@/shared/types';
import { formatDate, fromNow } from '@/shared/utils';

import { useProjectOverview } from '../hooks/useProjects';
import { useCurrentProject } from './ProjectLayout';

/** Done share of the non-cancelled tasks. */
const progressOf = ({ tasks_by_status: s }: ProjectOverview) => {
  const counted = s.total - s.cancelled;
  return counted > 0 ? Math.round((s.done / counted) * 100) : 0;
};

/** Project → Overview tab: everything from GET /projects/{id}/overview/. */
export const ProjectOverviewTab = () => {
  const { data: project } = useCurrentProject();
  const query = useProjectOverview(project?.id);
  if (!project) return null;

  return (
    <QueryState query={query}>
      {(o) => (
        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <Panel title="About">
              <p className="m-0 mb-4 whitespace-pre-wrap text-[14px] leading-6 text-fg">{o.description || <span className="text-fg-3">No description</span>}</p>
              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div><div className="text-fg-3">Start</div><div className="mt-1 text-fg">{formatDate(o.start_date)}</div></div>
                <div><div className="text-fg-3">Target</div><div className="mt-1 text-fg">{formatDate(o.target_date)}</div></div>
                <div><div className="text-fg-3">Lead</div><div className="mt-1"><UserAvatar user={o.lead} showName size={18} /></div></div>
                <div><div className="text-fg-3">Progress</div><Progress percent={progressOf(o)} size="small" strokeColor="#165dff" /></div>
              </div>
            </Panel>
            <Panel title="Tasks by status" extra={<span className="text-xs text-fg-3">{o.tasks_by_status.total} total</span>}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[...BOARD_COLUMNS, 'cancelled' as const].map((st) => (
                  <div key={st} className="rounded-md border border-line p-3">
                    <div className="flex items-center gap-1.5 text-xs text-fg-2"><StatusIcon status={st} size={12} />{TASK_STATUS[st].label}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums">{o.tasks_by_status[st] ?? 0}</div>
                  </div>
                ))}
                <div className="rounded-md border border-line p-3"><div className="text-xs text-danger">🚧 Blocked</div><div className="mt-1 text-xl font-semibold text-danger">{o.tasks_by_status.blocked}</div></div>
                <div className="rounded-md border border-line p-3"><div className="text-xs text-danger">Overdue</div><div className="mt-1 text-xl font-semibold text-danger">{o.tasks_by_status.overdue}</div></div>
              </div>
            </Panel>
          </div>
          <div className="flex flex-col gap-4">
            <Panel title="Active sprint" extra={o.active_sprint && <Link to={ROUTES.project(project.id, 'board')}>Open board</Link>}>
              {o.active_sprint ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-medium"><HugeiconsIcon icon={Rocket01Icon} size={15} className="hicon" strokeWidth={1.7} />{o.active_sprint.name}</div>
                  <div className="text-xs text-fg-2">
                    {formatDate(o.active_sprint.start_date)} — {formatDate(o.active_sprint.end_date)} ·{' '}
                    <Tag color={o.active_sprint.days_left < 2 ? 'red' : 'default'}>{o.active_sprint.days_left >= 0 ? `${o.active_sprint.days_left} days left` : 'Past due'}</Tag>
                  </div>
                </div>
              ) : (
                <EmptyState description="No active sprint" />
              )}
            </Panel>
            <Panel title="Top blockers">
              {o.top_blockers.length ? (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {o.top_blockers.map((b) => (
                    <li key={b.id} className="flex gap-2">
                      <UserAvatar user={b.blocked_by} />
                      <div className="min-w-0 text-[13px]">
                        <Link to={`?task=${b.task.id}`} className="font-mono text-xs">{b.task.key}</Link> <span className="text-fg">{b.task.title}</span>
                        <div className="text-xs text-fg-2">{b.reason}</div>
                        <div className="text-[11px] text-fg-3">since {fromNow(b.blocked_since)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState description="No active blockers 🎉" />
              )}
            </Panel>
          </div>
        </div>
      )}
    </QueryState>
  );
};
