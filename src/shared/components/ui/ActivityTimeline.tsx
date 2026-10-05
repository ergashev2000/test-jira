import { HugeiconsIcon } from '@hugeicons/react';
import { GlobeIcon, TelegramIcon } from '@hugeicons/core-free-icons';
import { Tooltip } from 'antd';

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { TASK_STATUS } from '@/shared/constants';
import type { Activity, Source, TaskStatus } from '@/shared/types';
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
    <b>{s || '—'}</b>
  );

export const SourceBadge = ({ source }: { source: Source }) =>
  source === 'telegram' ? (
    <Tooltip title="via Telegram">
      <span className="inline-flex items-center gap-1 text-[11px] text-telegram">
        <HugeiconsIcon icon={TelegramIcon} size={16} className="hicon" strokeWidth={1.7} /> Telegram
      </span>
    </Tooltip>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-fg-3">
      <HugeiconsIcon icon={GlobeIcon} size={16} className="hicon" strokeWidth={1.7} /> {source === 'api' ? 'API' : 'Web'}
    </span>
  );

/** Converts an activity record into a readable sentence. */
const describe = (a: Activity): ReactNode => {
  switch (a.action) {
    case 'created':
      return 'created the task';
    case 'updated':
      return <>updated the task{a.new_value && <> — <span className="text-fg-2">{a.new_value}</span></>}</>;
    case 'status_changed':
      return <>changed status <StatusInline s={a.old_value} /> → <StatusInline s={a.new_value} /></>;
    case 'reopened':
      return <>reopened the task <StatusInline s={a.old_value} /> → <StatusInline s={a.new_value} /></>;
    case 'assigned':
    case 'reassigned':
      return <>assigned to <b>{a.new_value || 'nobody'}</b>{a.old_value && <> (was {a.old_value})</>}</>;
    case 'moved_sprint':
      return <>moved to <b>{a.new_value || 'Backlog'}</b></>;
    case 'blocker_added':
      return <>marked as <span className="text-danger">blocked</span> — “{a.new_value}”</>;
    case 'blocker_resolved':
      return <>resolved the blocker</>;
    case 'cancelled':
      return <>cancelled the task{a.new_value && ` — ${a.new_value}`}</>;
    case 'cancel_requested':
      return <>requested cancellation{a.new_value && ` — ${a.new_value}`}</>;
    case 'cancel_rejected':
      return <>rejected the cancel request</>;
    case 'comment_added':
      return <>commented: <span className="text-fg-2">“{a.new_value}”</span></>;
    case 'attachment_added':
      return <>attached <b>{a.new_value}</b></>;
  }
};

export const ActivityTimeline = ({ items, showTask }: { items: Activity[]; showTask?: boolean }) => {
  const location = useLocation();
  return (
    <ol className="relative m-0 list-none space-y-0 p-0">
      {items.map((a) => (
        <li key={a.id} className="relative flex gap-3 pb-4 before:absolute before:left-[9px] before:top-6 before:h-[calc(100%-20px)] before:w-px before:bg-line last:before:hidden">
          <UserAvatar user={a.actor} size={20} />
          <div className="min-w-0 flex-1 text-[13px] leading-5 text-fg-2">
            <b className="font-medium text-fg">{a.actor?.full_name ?? 'System'}</b>{' '}
            {showTask && a.task && (
              <Link to={`${location.pathname}?task=${a.task.key}`} className="mr-1 font-mono text-xs !text-fg-2 hover:!text-fg">
                {a.task.key}
              </Link>
            )}
            {describe(a)}
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-fg-3">
              <Tooltip title={formatDateTime(a.created_at)}>
                <span>{isToday(a.created_at) ? formatTime(a.created_at) : fromNow(a.created_at)}</span>
              </Tooltip>
              <SourceBadge source={a.source} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
