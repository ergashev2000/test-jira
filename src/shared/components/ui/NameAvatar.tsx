import { Avatar } from 'antd';

import { colorFromId, initials } from '@/shared/utils';

interface Props {
  /** Seeds the avatar color, so the same entity always gets the same one. */
  id: string | number;
  name: string;
  size?: number;
  /** Dims the avatar (e.g. deactivated user). */
  inactive?: boolean;
}

/** Initials avatar + name, from plain data (no user lookup). */
export const NameAvatar = ({ id, name, size = 20, inactive }: Props) => (
  <span className="inline-flex min-w-0 items-center gap-2">
    <Avatar size={size} className="!shrink-0 !font-semibold"
      style={{ backgroundColor: colorFromId(String(id)), fontSize: size * 0.42, opacity: inactive ? 0.45 : 1 }}>
      {initials(name)}
    </Avatar>
    <span className="truncate">{name}</span>
  </span>
);
