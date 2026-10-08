import { HugeiconsIcon } from '@hugeicons/react';
import { UserIcon } from '@hugeicons/core-free-icons';
import { Avatar, Tooltip } from 'antd';

import type { UserBrief } from '@/shared/types';
import { cn, colorFromId, initials } from '@/shared/utils';

interface Props {
  /** User object as embedded in backend responses (assignee, author, manager…). */
  user: Pick<UserBrief, 'id' | 'full_name' | 'username'> | null | undefined;
  /** Dims the avatar — pass when the response carries `status: 'inactive'`. */
  inactive?: boolean;
  size?: number;
  showName?: boolean;
  className?: string;
  /** Hide tooltip (e.g. when name is shown next to it). */
  noTooltip?: boolean;
  /** Long names wrap onto the next line instead of being cut with "…". */
  wrap?: boolean;
}

const nameOf = (u: Pick<UserBrief, 'full_name' | 'username'>) => u.full_name || u.username;

export const UserAvatar = ({ user, inactive, size = 20, showName, className, noTooltip, wrap }: Props) => {
  if (!user) {
    const empty = (
      <Avatar size={size} icon={<HugeiconsIcon icon={UserIcon} size={16} className="hicon" strokeWidth={1.7} />} className="!border !border-dashed !border-line !bg-transparent !text-fg-3 shrink-0" />
    );
    return showName ? (
      <span className={cn('inline-flex max-w-full min-w-0 items-center gap-2 text-fg-3', className)}>
        {empty}
        <span className="min-w-0 truncate">Unassigned</span>
      </span>
    ) : (
      empty
    );
  }

  const name = nameOf(user);
  const avatar = (
    <Avatar
      size={size}
      style={{ backgroundColor: colorFromId(String(user.id)), fontSize: size * 0.42, opacity: inactive ? 0.45 : 1 }}
      className="!font-semibold shrink-0"
    >
      {initials(name)}
    </Avatar>
  );

  if (!showName) {
    return noTooltip ? avatar : <Tooltip title={`${name}${inactive ? ' (inactive)' : ''}`}>{avatar}</Tooltip>;
  }
  return (
    <span
      className={cn('inline-flex max-w-full min-w-0 items-center gap-2', className)}
      title={`${name}${inactive ? ' (inactive)' : ''}`}
    >
      {avatar}
      <span className={cn('min-w-0', wrap ? 'whitespace-normal' : 'truncate', inactive ? 'text-fg-3' : 'text-fg')}>
        {name}
        {inactive && <span className="ml-1 text-fg-3 shrink-0">(inactive)</span>}
      </span>
    </span>
  );
};

export const UserAvatarGroup = ({ users, max = 4, size = 22 }: { users: Pick<UserBrief, 'id' | 'full_name' | 'username'>[]; max?: number; size?: number }) => (
  <Avatar.Group max={{ count: max, style: { backgroundColor: 'var(--c-surface-3)', color: 'var(--c-fg-2)', fontSize: 11 } }} size={size}>
    {users.map((u) => (
      <Tooltip key={u.id} title={nameOf(u)}>
        <Avatar size={size} style={{ backgroundColor: colorFromId(String(u.id)), fontSize: size * 0.42 }}>
          {initials(nameOf(u))}
        </Avatar>
      </Tooltip>
    ))}
  </Avatar.Group>
);
