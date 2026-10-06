import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { App, Button } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can, DataTable, FilterBar, PageHeader } from '@/shared/components/ui';
import { PROJECT_STATUS_OPTIONS, ROUTES } from '@/shared/constants';
import { usePermission, useTableParams } from '@/shared/hooks';
import type { ProjectStatus } from '@/shared/types';
import { errorMessage } from '@/shared/utils';

import { ProjectFormModal } from '../components/ProjectFormModal';
import { getProjectColumns } from '../components/projectColumns';
import { useArchiveProject, useProjectList } from '../hooks/useProjects';
import type { Project } from '../types/project.types';

export const ProjectsPage = () => {
  const { get, page, pageSize, ordering } = useTableParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [modal, setModal] = useState<{ open: boolean; project?: Project }>({ open: false });
  const archive = useArchiveProject();
  const canArchive = usePermission('project.archive');
  const params = {
    page,
    page_size: pageSize,
    ordering: ordering ?? '-created_at',
    search: get('search'),
    status: get('status') as ProjectStatus | undefined,
    manager: get('manager') ? Number(get('manager')) : undefined,
    member: get('member') ? Number(get('member')) : undefined,
  };
  const query = useProjectList(params);

  const columns = getProjectColumns({
    canArchive,
    onEdit: (p) => setModal({ open: true, project: p }),
    onArchive: (p) => archive.mutateAsync(p.id).then(() => message.success(`${p.key} archived`)).catch((e) => message.error(errorMessage(e))),
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Projects" count={query.data?.count}
        extra={<Can permission="project.create"><Button type="primary" size="small" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setModal({ open: true })}>New project</Button></Can>}>
        <FilterBar
          filters={[
            { type: 'search', key: 'search', placeholder: 'Search name or key' },
            { type: 'select', key: 'status', placeholder: 'Status', options: PROJECT_STATUS_OPTIONS },
            { type: 'user', key: 'manager', placeholder: 'Manager' },
            { type: 'user', key: 'member', placeholder: 'Member' },
          ]}
        />
      </PageHeader>
      <div className="min-h-0 flex-1">
        <DataTable<Project> query={query} columns={columns} rowNumbers={false} scroll={{ x: 1100 }}
          onRowClick={(p) => navigate(ROUTES.project(p.id))} emptyText="No projects found" />
      </div>
      <ProjectFormModal open={modal.open} project={modal.project} onClose={() => setModal({ open: false })} />
    </div>
  );
};
