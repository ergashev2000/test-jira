import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Archive01Icon, Edit02Icon, LayoutGridIcon, ListViewIcon, Rocket01Icon } from '@hugeicons/core-free-icons';
import { App, Button, Popconfirm, Progress, Segmented, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can, DataTable, FilterBar, PageHeader, ProjectIcon, QueryState, UserAvatar, UserAvatarGroup } from '@/shared/components/ui';
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS, ROUTES } from '@/shared/constants';
import { usePermission, useTableParams } from '@/shared/hooks';
import type { ProjectStatus } from '@/shared/types';
import { errorMessage, formatDate } from '@/shared/utils';

import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsBoard } from '../components/ProjectsBoard';
import { useArchiveProject, useProjectList } from '../hooks/useProjects';
import type { Project } from '../types/project.types';

export const ProjectsPage = () => {
  const { get, set, page, pageSize, ordering } = useTableParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const view = get('view') === 'board' ? 'board' : 'list';
  const [modal, setModal] = useState<{ open: boolean; project?: Project }>({ open: false });
  const archive = useArchiveProject();
  const canArchive = usePermission('project.archive');
  const params = {
    page: view === 'board' ? 1 : page,
    page_size: view === 'board' ? 500 : pageSize,
    ordering: ordering ?? '-created_at',
    search: get('search'),
    status: get('status') as ProjectStatus | undefined,
    manager: get('manager') ? Number(get('manager')) : undefined,
    member: get('member') ? Number(get('member')) : undefined,
  };
  const query = useProjectList(params);

  const columns: ColumnsType<Project> = [
    { title: 'Project', dataIndex: 'name', sorter: true, render: (_: unknown, p: Project) => (
      <span className="flex items-center gap-2"><ProjectIcon projectKey={p.key} /><span className="font-medium text-fg">{p.name}</span></span>) },
    { title: 'Key', dataIndex: 'key', width: 80, sorter: true, render: (k: string) => <span className="font-mono text-xs text-fg-2">{k}</span> },
    { title: 'Manager', dataIndex: 'manager', key: 'manager__full_name', width: 190, render: (_: unknown, p: Project) => <UserAvatar user={p.manager} showName /> },
    { title: 'Members', dataIndex: 'members', key: 'members_count', width: 130, render: (_: unknown, p: Project) => <UserAvatarGroup users={p.members ?? []} /> },
    { title: 'Active sprint', dataIndex: 'active_sprint', width: 130, render: (s: Project['active_sprint']) =>
      s ? <span className="flex items-center gap-1.5 text-fg-2"><HugeiconsIcon icon={Rocket01Icon} size={13} className="hicon" strokeWidth={1.7} />{s.name}</span> : <span className="text-fg-3">—</span> },
    { title: 'Progress', dataIndex: 'progress', width: 170, render: (_: unknown, p: Project) => (
      <Tooltip title={`${p.tasks_done ?? 0} of ${p.tasks_total ?? 0} done (cancelled excluded)`}>
        <Progress percent={p.progress ?? 0} size="small" strokeColor="#165dff" className="!m-0" />
      </Tooltip>) },
    { title: 'Status', dataIndex: 'status', width: 110, sorter: true, render: (s: ProjectStatus) => <Tag color={PROJECT_STATUS[s].color}>{PROJECT_STATUS[s].label}</Tag> },
    { title: 'Created', dataIndex: 'created_at', width: 110, sorter: true, render: (d: string) => <span className="text-fg-2">{formatDate(d)}</span> },
    { title: '', key: 'actions', width: 90, render: (_: unknown, p: Project) => (
      <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Can permission="project.create">
          <Button size="small" type="text" icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} disabled={p.status === 'archived'} onClick={() => setModal({ open: true, project: p })} />
        </Can>
        {canArchive && p.status !== 'archived' && (
          <Popconfirm title={`Archive ${p.key}?`} description="No new tasks can be created in an archived project." okText="Archive" okButtonProps={{ danger: true }}
            onConfirm={() => archive.mutateAsync(p.id).then(() => message.success(`${p.key} archived`)).catch((e) => message.error(errorMessage(e)))}>
            <Button size="small" type="text" icon={<HugeiconsIcon icon={Archive01Icon} size={14} className="hicon" strokeWidth={1.7} />} />
          </Popconfirm>
        )}
      </span>) },
  ];

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
          keep={['view']}
          extra={<Segmented size="small" value={view} onChange={(v) => set({ view: v === 'board' ? 'board' : undefined })}
            options={[{ value: 'list', icon: <HugeiconsIcon icon={ListViewIcon} size={14} className="hicon" strokeWidth={1.7} /> }, { value: 'board', icon: <HugeiconsIcon icon={LayoutGridIcon} size={14} className="hicon" strokeWidth={1.7} /> }]} />}
        />
      </PageHeader>
      <div className="min-h-0 flex-1">
        {view === 'board' ? (
          <QueryState query={query}>{(data) => <ProjectsBoard items={data.results} />}</QueryState>
        ) : (
          <DataTable<Project> query={query} columns={columns} rowNumbers={false} scroll={{ x: 1100 }}
            onRowClick={(p) => navigate(ROUTES.project(p.key))} emptyText="No projects found" />
        )}
      </div>
      <ProjectFormModal open={modal.open} project={modal.project} onClose={() => setModal({ open: false })} />
    </div>
  );
};
