import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { Avatar, Button, Tooltip } from 'antd';

import { Can, NameAvatar } from '@/shared/components/ui';
import { colorFromId, formatDate, initials } from '@/shared/utils';

import { useTeamMembers } from '../hooks/useTeams';
import type { Team } from '../types/team.types';

export const TeamCard = ({ team, onEdit }: { team: Team; onEdit: () => void }) => {
  const { data: members } = useTeamMembers(team.id);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary"><HugeiconsIcon icon={UserGroupIcon} size={16} className="hicon" strokeWidth={1.7} /></span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-fg">{team.name}</div>
          <div className="text-xs text-fg-3">Since {formatDate(team.created_at)}</div>
        </div>
        <Can permission="team.manage">
          <Button size="small" type="text" icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={onEdit} aria-label="Edit team" />
        </Can>
      </div>
      <div className="flex items-center justify-between text-xs text-fg-2">
        <span className="flex items-center gap-2">Lead {team.lead
          ? <NameAvatar id={team.lead.id} name={team.lead.full_name || team.lead.username} size={18} />
          : <span className="text-fg-3">—</span>}</span>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs text-fg-2">{team.members_count} members</span>
        <Avatar.Group max={{ count: 6, style: { backgroundColor: 'var(--c-surface-3)', color: 'var(--c-fg-2)', fontSize: 11 } }} size={22}>
          {(members ?? []).map((m) => (
            <Tooltip key={m.id} title={m.full_name || m.username}>
              <Avatar size={22} style={{ backgroundColor: colorFromId(String(m.id)), fontSize: 22 * 0.42 }}>{initials(m.full_name || m.username)}</Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      </div>
    </div>
  );
};
