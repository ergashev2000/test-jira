import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { Button } from 'antd';
import { useState } from 'react';

import { useCurrentProject } from '@/modules/projects';
import { useProjectLookups } from '@/shared/api/lookups';
import { Can, FilterBar, PageHeader } from '@/shared/components/ui';
import { SPRINT_STATUS_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { SprintStatus } from '@/shared/types';

import { SprintFormModal } from '../components/SprintModals';
import { SprintsTable } from '../components/SprintsTable';
import { useSprints } from '../hooks/useSprints';

/** /sprints — all sprints across visible projects. */
export const SprintsPage = () => {
  const { get, page, pageSize, ordering } = useTableParams();
  const { data: projects = [] } = useProjectLookups();
  const query = useSprints({
    page, page_size: pageSize, ordering: ordering ?? '-start_date', search: get('search'),
    project: get('project') ? Number(get('project')) : undefined, status: get('status') as SprintStatus | undefined,
  });
  return (
    <>
      <PageHeader title="Sprints" count={query.data?.count}>
        <FilterBar filters={[
          { type: 'search', key: 'search', placeholder: 'Search name or goal' },
          { type: 'select', key: 'project', placeholder: 'Project', options: projects.map((p) => ({ value: String(p.id), label: p.name })) },
          { type: 'select', key: 'status', placeholder: 'Status', options: SPRINT_STATUS_OPTIONS },
        ]} />
      </PageHeader>
      <SprintsTable query={query} showProject />
    </>
  );
};

/** Project → Sprints tab. */
export const ProjectSprintsTab = () => {
  const { data: project } = useCurrentProject();
  const { page, pageSize, ordering } = useTableParams();
  const [open, setOpen] = useState(false);
  const query = useSprints({ project: project?.id, page, page_size: pageSize, ordering: ordering ?? '-start_date' }, !!project);
  if (!project) return null;
  return (
    <div className="p-5">
      <div className="mb-3 flex">
        <Can permission="sprint.manage">
          <Button className="!ml-auto" size="small" type="primary" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} disabled={project.status === 'archived'}
            onClick={() => setOpen(true)}>Create sprint</Button>
        </Can>
      </div>
      <SprintsTable query={query} />
      <SprintFormModal open={open} projectId={project.id} onClose={() => setOpen(false)} />
    </div>
  );
};
