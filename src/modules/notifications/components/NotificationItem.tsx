import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Alert02Icon, AlertCircleIcon, Analytics01Icon, CheckListIcon, CheckmarkCircle02Icon, Clock01Icon, Edit02Icon, Rocket01Icon, StopCircleIcon, UserIcon, UserMultipleIcon } from '@hugeicons/core-free-icons';
import type { AppNotification, NotificationType } from '@/shared/types';
import { cn, fromNow } from '@/shared/utils';

export const NOTIFICATION_META: Record<NotificationType, { icon: IconSvgElement; color: string; label: string }> = {
  TASK_ASSIGNED: { icon: UserIcon, color: '#165dff', label: 'Task assigned' },
  TASK_REASSIGNED: { icon: UserMultipleIcon, color: '#165dff', label: 'Task reassigned' },
  DEADLINE_APPROACHING: { icon: Clock01Icon, color: '#f2994a', label: 'Deadline approaching' },
  TASK_OVERDUE: { icon: AlertCircleIcon, color: '#eb5757', label: 'Task overdue' },
  TASK_BLOCKED: { icon: Alert02Icon, color: '#eb5757', label: 'Task blocked' },
  BLOCKER_RESOLVED: { icon: CheckmarkCircle02Icon, color: '#4cb782', label: 'Blocker resolved' },
  COMMENT_ADDED: { icon: Edit02Icon, color: '#26b5ce', label: 'Comment added' },
  SPRINT_STARTED: { icon: Rocket01Icon, color: '#4cb782', label: 'Sprint started' },
  SPRINT_ENDING: { icon: Rocket01Icon, color: '#f2994a', label: 'Sprint ending' },
  DAILY_REMINDER: { icon: CheckListIcon, color: '#9c9ca3', label: 'Daily reminder' },
  DAILY_REPORT: { icon: Analytics01Icon, color: '#bb87fc', label: 'Daily report' },
  CANCEL_REQUESTED: { icon: StopCircleIcon, color: '#f2994a', label: 'Cancel requested' },
};

export const NotificationItem = ({ n, onClick, compact }: { n: AppNotification; onClick: () => void; compact?: boolean }) => {
  const meta = NOTIFICATION_META[n.type];
  return (
    <button type="button" onClick={onClick}
      className={cn('flex w-full cursor-pointer items-start gap-3 border-0 bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-surface-2', compact ? 'rounded-md' : 'border-b border-line')}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${meta.color}1f`, color: meta.color }}>
        <HugeiconsIcon icon={meta.icon} size={15} className="hicon" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[13px]', n.isRead ? 'text-fg-2' : 'font-semibold text-fg')}>{n.title}</span>
        <span className={cn('block text-xs text-fg-2', compact && 'line-clamp-2')}>{n.message}</span>
        <span className="mt-0.5 block text-[11px] text-fg-3">{fromNow(n.createdAt)}</span>
      </span>
      {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
};
