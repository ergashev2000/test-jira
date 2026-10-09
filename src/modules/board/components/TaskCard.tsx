import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { useDraggable } from '@dnd-kit/core';
import { Tooltip } from 'antd';

import type { Task } from '@/modules/tasks';
import { BlockedBadge, DeadlineText, PriorityIcon, TaskTypeIcon, UserAvatar } from '@/shared/components/ui';
import { cn } from '@/shared/utils';

interface Props {
  task: Task;
  onOpen?: (id: number) => void;
  overlay?: boolean;
  /** Sits on a board background — slightly see-through card. */
  glass?: boolean;
  /** Open in the task panel right now. */
  selected?: boolean;
}

export const TaskCardView = ({ task, overlay, glass, selected }: Omit<Props, 'onOpen'>) => {
  const labels = (task.labels ?? []).slice(0, 2);
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-3 text-left shadow-sm transition-[background-color,border-color,box-shadow,transform] hover:-translate-y-px hover:shadow-md',
        glass ? 'border-white/10 bg-card/90 backdrop-blur-sm hover:border-white/25 hover:bg-card' : 'border-line bg-card hover:border-line-strong hover:bg-surface-2',
        task.is_blocked && 'border-l-2 border-l-danger',
        selected && 'border-primary! ring-1 ring-primary',
        overlay && 'rotate-[1.5deg] cursor-grabbing border-line-strong shadow-2xl shadow-(color:--c-shadow)',
      )}
    >
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <TaskTypeIcon type={task.type} size={12} />
        <span className="font-mono">{task.key}</span>
        <Tooltip title={`Priority: ${task.priority}`}>
          <span className="flex items-center"><PriorityIcon priority={task.priority} size={12} /></span>
        </Tooltip>
        {task.is_blocked && <BlockedBadge reason={task.active_blocker?.reason} compact />}
        <span className="ml-auto"><UserAvatar user={task.assignee} size={18} /></span>
      </div>
      <div className="line-clamp-2 text-[13px] font-medium leading-5 text-fg">{task.title}</div>
      {(task.deadline || labels.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {task.deadline && (
            <span className={cn('flex h-5 items-center gap-1 rounded border px-1.5 text-[11px]', task.is_overdue ? 'border-danger/40' : 'border-line')}>
              <HugeiconsIcon icon={Calendar03Icon} size={11} className="hicon" strokeWidth={1.7} />
              <DeadlineText task={task} className="!text-[11px]" />
            </span>
          )}
          {labels.map((l) => (
            <span key={l} className="flex h-5 items-center rounded-full bg-fg/5 px-2 text-[11px] text-fg-2">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskCard = ({ task, onOpen, glass, selected }: Props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(task.id)}
      className={cn('cursor-pointer touch-none outline-none', isDragging && 'opacity-30')}
    >
      <TaskCardView task={task} glass={glass} selected={selected} />
    </div>
  );
};
