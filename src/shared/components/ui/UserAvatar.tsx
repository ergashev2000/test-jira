import { Avatar, Tooltip } from 'antd';
import { Icon } from './Icon';

import { useUserMap } from '@/shared/api/lookups';
import { cn, colorFromId, initials } from '@/shared/utils';

interface Props {
  userId: string | null | undefined;
  size?: number;
  showName?: boolean;
  className?: string;
  /** Hide tooltip (e.g. when name is shown next to it). */
  noTooltip?: boolean;
}

export const UserAvatar = ({ userId, size = 20, showName, className, noTooltip }: Props) => {
  const map = useUserMap();
  const user = userId ? map.get(userId) : undefined;

  if (!userId || !user) {
    const empty = (
      <Avatar size={size} icon={<Icon name="user" />} className="!border !border-dashed !border-line !bg-transparent !text-fg-3" />
    );
    return showName ? (
      <span className={cn('inline-flex items-center gap-2 text-fg-3', className)}>
        {empty}
        Unassigned
      </span>
    ) : (
      empty
    );
  }

  const inactive = user.status === 'INACTIVE';
  const avatar = (
    <Avatar
      size={size}
      style={{ backgroundColor: colorFromId(user.id), fontSize: size * 0.42, opacity: inactive ? 0.45 : 1 }}
      className="!font-semibold"
    >
      {initials(user.fullName)}
    </Avatar>
  );

  if (!showName) {
    return noTooltip ? avatar : <Tooltip title={`${user.fullName}${inactive ? ' (inactive)' : ''}`}>{avatar}</Tooltip>;
  }
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      {avatar}
      <span className={cn('truncate', inactive ? 'text-fg-3' : 'text-fg')}>
        {user.fullName}
        {inactive && <span className="ml-1 text-fg-3">(inactive)</span>}
      </span>
    </span>
  );
};

export const UserAvatarGroup = ({ userIds, max = 4, size = 22 }: { userIds: string[]; max?: number; size?: number }) => {
  const map = useUserMap();
  return (
    <Avatar.Group max={{ count: max, style: { backgroundColor: 'var(--c-surface-3)', color: 'var(--c-fg-2)', fontSize: 11 } }} size={size}>
      {userIds.map((id) => {
        const u = map.get(id);
        return (
          <Tooltip key={id} title={u?.fullName}>
            <Avatar size={size} style={{ backgroundColor: colorFromId(id), fontSize: size * 0.42 }}>
              {u ? initials(u.fullName) : '?'}
            </Avatar>
          </Tooltip>
        );
      })}
    </Avatar.Group>
  );
};
