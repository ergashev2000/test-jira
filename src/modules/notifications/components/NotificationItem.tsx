import { Icon, type IconName } from '@/shared/components/ui';
import type { AppNotification, NotificationType } from '@/shared/types';
import { cn, fromNow } from '@/shared/utils';

export const NOTIFICATION_META: Record<NotificationType, { icon: IconName; color: string; label: string }> = {
  TASK_ASSIGNED: { icon: 'user', color: '#5e6ad2', label: 'Task assigned' },
  TASK_REASSIGNED: { icon: 'users', color: '#5e6ad2', label: 'Task reassigned' },
  DEADLINE_APPROACHING: { icon: 'clock', color: '#f2994a', label: 'Deadline approaching' },
  TASK_OVERDUE: { icon: 'alertCircle', color: '#eb5757', label: 'Task overdue' },
  TASK_BLOCKED: { icon: 'alert', color: '#eb5757', label: 'Task blocked' },
  BLOCKER_RESOLVED: { icon: 'check', color: '#4cb782', label: 'Blocker resolved' },
  COMMENT_ADDED: { icon: 'edit', color: '#26b5ce', label: 'Comment added' },
  SPRINT_STARTED: { icon: 'sprint', color: '#4cb782', label: 'Sprint started' },
  SPRINT_ENDING: { icon: 'sprint', color: '#f2994a', label: 'Sprint ending' },
  DAILY_REMINDER: { icon: 'checklist', color: '#9c9ca3', label: 'Daily reminder' },
  DAILY_REPORT: { icon: 'analytics', color: '#bb87fc', label: 'Daily report' },
  CANCEL_REQUESTED: { icon: 'stop', color: '#f2994a', label: 'Cancel requested' },
};

export const NotificationItem = ({ n, onClick, compact }: { n: AppNotification; onClick: () => void; compact?: boolean }) => {
  const meta = NOTIFICATION_META[n.type];
  return (
    <button type="button" onClick={onClick}
      className={cn('flex w-full cursor-pointer items-start gap-3 border-0 bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-surface-2', compact ? 'rounded-md' : 'border-b border-line')}>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${meta.color}1f`, color: meta.color }}>
        <Icon name={meta.icon} size={15} />
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
