import { HugeiconsIcon } from '@hugeicons/react';
import { GlobeIcon, TelegramIcon } from '@hugeicons/core-free-icons';
import { Tooltip } from 'antd';

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useUserMap } from '@/shared/api/lookups';
import { CANCEL_REASONS, TASK_STATUS } from '@/shared/constants';
import type { ActivityItem, CancelReason, Source, TaskStatus } from '@/shared/types';
import { formatDateTime, formatTime, fromNow, isToday } from '@/shared/utils';

import { StatusIcon } from './icons';
import { UserAvatar } from './UserAvatar';

const StatusInline = ({ s }: { s: string | null }) =>
  s && s in TASK_STATUS ? (
    <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-px text-xs text-fg">
      <StatusIcon status={s as TaskStatus} size={11} />
      {TASK_STATUS[s as TaskStatus].label}
    </span>
  ) : (
    <b>{s ?? '—'}</b>
  );

export const SourceBadge = ({ source }: { source: Source }) =>
  source === 'TELEGRAM' ? (
    <Tooltip title="via Telegram">
      <span className="inline-flex items-center gap-1 text-[11px] text-telegram">
        <HugeiconsIcon icon={TelegramIcon} size={16} className="hicon" strokeWidth={1.7} /> Telegram
      </span>
    </Tooltip>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-fg-3">
      <HugeiconsIcon icon={GlobeIcon} size={16} className="hicon" strokeWidth={1.7} /> {source === 'API' ? 'API' : 'Web'}
    </span>
  );

/** Converts an activity record into a readable sentence. */
const useDescribe = () => {
  const users = useUserMap();
  const name = (id: string | null) => (id ? (users.get(id)?.fullName ?? 'Unknown') : 'nobody');
  return (a: ActivityItem): ReactNode => {
    switch (a.action) {
      case 'CREATED':
        return 'created the task';
      case 'STATUS_CHANGED':
        return <>changed status <StatusInline s={a.oldValue} /> → <StatusInline s={a.newValue} /></>;
      case 'REOPENED':
        return <>reopened the task <StatusInline s={a.oldValue} /> → <StatusInline s={a.newValue} /></>;
      case 'ASSIGNED':
        return <>assigned to <b>{name(a.newValue)}</b>{a.oldValue && <> (was {name(a.oldValue)})</>}</>;
      case 'PRIORITY_CHANGED':
        return <>changed priority <b>{a.oldValue}</b> → <b>{a.newValue}</b></>;
      case 'DEADLINE_CHANGED':
        return <>changed deadline to <b>{a.newValue ?? 'none'}</b></>;
      case 'SPRINT_CHANGED':
        return <>moved to <b>{a.newValue ?? 'Backlog'}</b></>;
      case 'BLOCKED':
        return <>marked as <span className="text-danger">blocked</span> — “{a.newValue}”</>;
      case 'BLOCKER_RESOLVED':
        return <>resolved the blocker</>;
      case 'CANCELLED':
        return <>cancelled the task{a.newValue && a.newValue in CANCEL_REASONS && ` — ${CANCEL_REASONS[a.newValue as CancelReason]}`}</>;
      case 'CANCEL_REQUESTED':
        return <>requested cancellation{a.newValue && a.newValue in CANCEL_REASONS && ` — ${CANCEL_REASONS[a.newValue as CancelReason]}`}</>;
      case 'COMMENTED':
        return <>commented: <span className="text-fg-2">“{a.newValue}”</span></>;
      case 'ATTACHMENT_ADDED':
        return <>attached <b>{a.newValue}</b></>;
    }
  };
};

export const ActivityTimeline = ({ items, showTask }: { items: ActivityItem[]; showTask?: boolean }) => {
  const describe = useDescribe();
  const location = useLocation();
  return (
    <ol className="relative m-0 list-none space-y-0 p-0">
      {items.map((a) => (
        <li key={a.id} className="relative flex gap-3 pb-4 before:absolute before:left-[9px] before:top-6 before:h-[calc(100%-20px)] before:w-px before:bg-line last:before:hidden">
          <UserAvatar userId={a.actorId} size={20} />
          <div className="min-w-0 flex-1 text-[13px] leading-5 text-fg-2">
            <b className="font-medium text-fg">{a.actorName}</b>{' '}
            {showTask && (
              <Link to={`${location.pathname}?task=${a.taskKey}`} className="mr-1 font-mono text-xs !text-fg-2 hover:!text-fg">
                {a.taskKey}
              </Link>
            )}
            {describe(a)}
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-fg-3">
              <Tooltip title={formatDateTime(a.createdAt)}>
                <span>{isToday(a.createdAt) ? formatTime(a.createdAt) : fromNow(a.createdAt)}</span>
              </Tooltip>
              <SourceBadge source={a.source} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
