import type { ReactNode } from 'react';

import { BlockedBadge, DeadlineText, PriorityTag, StatusIcon, UserAvatar } from '@/shared/components/ui';

import { useTaskDrawer } from '../hooks/useTaskUi';
import type { Task } from '../types/task.types';
import { StatusDropdown } from './StatusDropdown';

/** Linear-style dense list row (key · status · title … meta · avatar · actions). */
export const TaskListRow = ({ task, actions }: { task: Task; actions?: ReactNode }) => {
  const { openTask } = useTaskDrawer();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.key)}
      onKeyDown={(e) => e.key === 'Enter' && openTask(task.key)}
      className="group flex h-11 cursor-pointer items-center gap-3 border-b border-line px-5 text-[13px] last:border-b-0 hover:bg-surface-2"
    >
      <span className="w-16 shrink-0 font-mono text-xs text-fg-3">{task.key}</span>
      <StatusDropdown task={task}>
        <span className="flex"><StatusIcon status={task.status} /></span>
      </StatusDropdown>
      <span className={`min-w-0 flex-1 truncate text-fg ${task.status === 'cancelled' ? 'line-through opacity-60' : ''}`}>{task.title}</span>
      {task.is_blocked && <BlockedBadge reason={task.active_blocker?.reason} compact />}
      <span className="hidden items-center gap-1 md:flex">
        {(task.labels ?? []).slice(0, 2).map((l) => (
          <span key={l} className="rounded-full border border-line px-2 text-[11px] leading-5 text-fg-2">{l}</span>
        ))}
      </span>
      <PriorityTag priority={task.priority} iconOnly />
      <span className="hidden w-40 text-right text-xs sm:block"><DeadlineText task={task} /></span>
      <UserAvatar user={task.assignee} />
      {actions && <span onClick={(e) => e.stopPropagation()} className="flex">{actions}</span>}
    </div>
  );
};
