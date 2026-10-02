import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { Button } from 'antd';
import { useState } from 'react';

import { Can, EmptyState, PageHeader, QueryState } from '@/shared/components/ui';

import { TeamCard } from '../components/TeamCard';
import { TeamModal } from '../components/TeamModal';
import { useTeamList } from '../hooks/useTeams';
import type { Team } from '../types/team.types';

export const TeamsPage = () => {
  const query = useTeamList({ page_size: 100 });
  const [modal, setModal] = useState<{ open: boolean; team?: Team }>({ open: false });
  return (
    <>
      <PageHeader title="Teams" count={query.data?.count}
        extra={<Can permission="team.manage"><Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setModal({ open: true })}>New team</Button></Can>} />
      <div className="p-5">
        <QueryState query={query} isEmpty={(d) => !d.results.length} empty={<EmptyState description="No teams yet" />}>
          {(data) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.results.map((t) => <TeamCard key={t.id} team={t} onEdit={() => setModal({ open: true, team: t })} />)}
            </div>
          )}
        </QueryState>
      </div>
      <TeamModal open={modal.open} team={modal.team} onClose={() => setModal({ open: false })} />
    </>
  );
};
