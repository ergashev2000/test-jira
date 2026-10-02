import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { Button } from 'antd';
import { useState } from 'react';

import { useCurrentProject } from '@/modules/projects';
import { useProjectLookups } from '@/shared/api/lookups';
import { Can, EmptyState, FilterBar, PageHeader, QueryState } from '@/shared/components/ui';
import { SPRINT_STATUS_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { SprintStatus } from '@/shared/types';

import { SprintFormModal } from '../components/SprintModals';
import { SprintsTable } from '../components/SprintsTable';
import { useSprints } from '../hooks/useSprints';

/** /sprints — all sprints across visible projects. */
export const SprintsPage = () => {
  const { get } = useTableParams();
  const { data: projects = [] } = useProjectLookups();
  const query = useSprints({ projectId: get('projectId'), status: get('status') as SprintStatus | undefined });
  return (
    <>
      <PageHeader title="Sprints" count={query.data?.length}>
        <FilterBar filters={[
          { type: 'select', key: 'projectId', placeholder: 'Project', options: projects.map((p) => ({ value: p.id, label: p.name })) },
          { type: 'select', key: 'status', placeholder: 'Status', options: SPRINT_STATUS_OPTIONS },
        ]} />
      </PageHeader>
      <QueryState query={query} isEmpty={(d) => !d.length} empty={<EmptyState description="No sprints" />}>
        {(items) => <SprintsTable items={items} showProject loading={query.isFetching} />}
      </QueryState>
    </>
  );
};

/** Project → Sprints tab. */
export const ProjectSprintsTab = () => {
  const { data: project } = useCurrentProject();
  const [open, setOpen] = useState(false);
  const query = useSprints({ projectId: project?.id }, !!project);
  if (!project) return null;
  return (
    <div className="p-5">
      <div className="mb-3 flex">
        <Can permission="sprint.manage">
          <Button className="!ml-auto" size="small" type="primary" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} disabled={project.status === 'ARCHIVED'}
            onClick={() => setOpen(true)}>Create sprint</Button>
        </Can>
      </div>
      <QueryState query={query} isEmpty={(d) => !d.length} empty={<EmptyState description="No sprints yet" />}>
        {(items) => <SprintsTable items={items} />}
      </QueryState>
      <SprintFormModal open={open} projectId={project.id} onClose={() => setOpen(false)} />
    </div>
  );
};
