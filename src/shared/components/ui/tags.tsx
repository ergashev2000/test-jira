import { Tooltip } from 'antd';
import type { ReactNode } from 'react';

import { PRIORITY, TASK_STATUS } from '@/shared/constants';
import type { Priority, Task, TaskStatus } from '@/shared/types';
import { cn, daysFromToday, formatDate, isOverdue } from '@/shared/utils';

import { PriorityIcon, StatusIcon } from './icons';

/** Linear-style pill: subtle border, icon + label. */
export const Chip = ({
  icon,
  children,
  className,
  title,
}: {
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  title?: string;
}) => (
  <span
    title={title}
    className={cn(
      'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2 text-xs text-fg-2',
      className,
    )}
  >
    {icon}
    {children}
  </span>
);

export const StatusTag = ({ status, iconOnly }: { status: TaskStatus; iconOnly?: boolean }) =>
  iconOnly ? (
    <Tooltip title={TASK_STATUS[status].label}>
      <span className="inline-flex">
        <StatusIcon status={status} />
      </span>
    </Tooltip>
  ) : (
    <Chip icon={<StatusIcon status={status} size={12} />} className={cn(status === 'cancelled' && 'line-through')}>
      {TASK_STATUS[status].label}
    </Chip>
  );

export const PriorityTag = ({ priority, iconOnly }: { priority: Priority; iconOnly?: boolean }) =>
  iconOnly ? (
    <Tooltip title={`Priority: ${PRIORITY[priority].label}`}>
      <span className="inline-flex">
        <PriorityIcon priority={priority} />
      </span>
    </Tooltip>
  ) : (
    <Chip icon={<PriorityIcon priority={priority} size={12} />}>{PRIORITY[priority].label}</Chip>
  );

export const BlockedBadge = ({ reason, compact }: { reason?: string | null; compact?: boolean }) => (
  <Tooltip title={reason ? `Blocked: ${reason}` : 'Blocked'}>
    <span className="inline-flex h-5 items-center gap-1 rounded-md bg-danger/15 px-1.5 text-[11px] font-medium text-danger">
      🚧{!compact && ' Blocked'}
    </span>
  </Tooltip>
);

export const OverdueBadge = ({ deadline }: { deadline: string }) => (
  <span className="inline-flex h-5 items-center rounded-md bg-danger/15 px-1.5 text-[11px] font-medium text-danger">
    Overdue · {Math.abs(daysFromToday(deadline))}d
  </span>
);

export const DeadlineText = ({ task, className }: { task: Pick<Task, 'deadline' | 'status'>; className?: string }) => {
  if (!task.deadline) return <span className="text-fg-3">—</span>;
  const overdue = isOverdue(task);
  const diff = daysFromToday(task.deadline);
  const today = diff === 0 && task.status !== 'done' && task.status !== 'cancelled';
  return (
    <span className={cn('whitespace-nowrap', overdue ? 'text-danger' : today ? 'text-warn' : 'text-fg-2', className)}>
      {today ? 'Today' : formatDate(task.deadline)}
      {overdue && ` · ${Math.abs(diff)}d overdue`}
    </span>
  );
};
