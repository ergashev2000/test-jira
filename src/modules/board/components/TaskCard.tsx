import { useDraggable } from '@dnd-kit/core';
import { Tooltip } from 'antd';

import type { TaskRow } from '@/modules/tasks';
import { BlockedBadge, DeadlineText, Icon, PriorityIcon, TaskTypeIcon, UserAvatar } from '@/shared/components/ui';
import { cn, isOverdue } from '@/shared/utils';

interface Props {
  task: TaskRow;
  onOpen?: (key: string) => void;
  overlay?: boolean;
}

export const TaskCardView = ({ task, overlay }: Omit<Props, 'onOpen'>) => (
  <div
    className={cn(
      'flex flex-col gap-2 rounded-lg border border-line bg-card p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2',
      task.isBlocked && 'border-l-2 border-l-danger',
      overlay && 'rotate-[1.5deg] cursor-grabbing border-line-strong shadow-2xl shadow-(color:--c-shadow)',
    )}
  >
    <div className="flex items-center gap-2 text-xs text-fg-3">
      <TaskTypeIcon type={task.type} size={12} />
      <span className="font-mono">{task.key}</span>
      {task.isBlocked && <BlockedBadge reason={task.blockerReason} compact />}
      <span className="ml-auto"><UserAvatar userId={task.assigneeId} size={18} /></span>
    </div>
    <div className="line-clamp-2 text-[13px] leading-5 text-fg">{task.title}</div>
    <div className="flex flex-wrap items-center gap-1.5">
      <Tooltip title={`Priority: ${task.priority.toLowerCase()}`}>
        <span className="flex h-5 items-center rounded border border-line px-1"><PriorityIcon priority={task.priority} size={12} /></span>
      </Tooltip>
      {task.deadline && (
        <span className={cn('flex h-5 items-center gap-1 rounded border px-1.5 text-[11px]', isOverdue(task) ? 'border-danger/40' : 'border-line')}>
          <Icon name="calendar" size={11} />
          <DeadlineText task={task} className="!text-[11px]" />
        </span>
      )}
      {task.labels.slice(0, 2).map((l) => (
        <span key={l} className="flex h-5 items-center rounded-full border border-line px-2 text-[11px] text-fg-2">{l}</span>
      ))}
    </div>
  </div>
);

export const TaskCard = ({ task, onOpen }: Props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen?.(task.key)}
      className={cn('cursor-pointer touch-none outline-none', isDragging && 'opacity-30')}
    >
      <TaskCardView task={task} />
    </div>
  );
};
