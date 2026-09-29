import { App, Button, Popconfirm, Progress, Segmented, Table, Tag, Tooltip } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Can, FilterBar, Icon, PageHeader, ProjectIcon, QueryState, UserAvatar, UserAvatarGroup } from '@/shared/components/ui';
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS, ROUTES } from '@/shared/constants';
import { usePermission, useTableParams } from '@/shared/hooks';
import type { ProjectStatus } from '@/shared/types';
import { errorMessage, formatDate } from '@/shared/utils';

import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsBoard } from '../components/ProjectsBoard';
import { useArchiveProject, useProjectList } from '../hooks/useProjects';
import type { ProjectListItem } from '../types/project.types';

export const ProjectsPage = () => {
  const { get, set, page, pageSize, pagination } = useTableParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const view = get('view') === 'board' ? 'board' : 'list';
  const [modal, setModal] = useState<{ open: boolean; project?: ProjectListItem }>({ open: false });
  const archive = useArchiveProject();
  const canArchive = usePermission('project.archive');
  const params = {
    page: view === 'board' ? 1 : page,
    pageSize: view === 'board' ? 500 : pageSize,
    search: get('search'),
    status: get('status') as ProjectStatus | undefined,
    managerId: get('managerId'),
    memberId: get('memberId'),
  };
  const query = useProjectList(params);

  const columns = [
    { title: 'Project', dataIndex: 'name', render: (_: unknown, p: ProjectListItem) => (
      <span className="flex items-center gap-2"><ProjectIcon projectKey={p.key} /><span className="font-medium text-fg">{p.name}</span></span>) },
    { title: 'Key', dataIndex: 'key', width: 80, render: (k: string) => <span className="font-mono text-xs text-fg-2">{k}</span> },
    { title: 'Manager', dataIndex: 'managerId', width: 190, render: (id: string) => <UserAvatar userId={id} showName /> },
    { title: 'Members', dataIndex: 'memberIds', width: 130, render: (ids: string[]) => <UserAvatarGroup userIds={ids} /> },
    { title: 'Active sprint', dataIndex: 'activeSprint', width: 130, render: (s: ProjectListItem['activeSprint']) =>
      s ? <span className="flex items-center gap-1.5 text-fg-2"><Icon name="sprint" size={13} />{s.name}</span> : <span className="text-fg-3">—</span> },
    { title: 'Progress', dataIndex: 'progress', width: 170, render: (_: unknown, p: ProjectListItem) => (
      <Tooltip title={`${p.doneTasks} of ${p.totalTasks} done (cancelled excluded)`}>
        <Progress percent={p.progress} size="small" strokeColor="#5e6ad2" className="!m-0" />
      </Tooltip>) },
    { title: 'Status', dataIndex: 'status', width: 110, render: (s: ProjectStatus) => <Tag color={PROJECT_STATUS[s].color}>{PROJECT_STATUS[s].label}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', width: 110, render: (d: string) => <span className="text-fg-2">{formatDate(d)}</span> },
    { title: '', key: 'actions', width: 90, render: (_: unknown, p: ProjectListItem) => (
      <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Can permission="project.create">
          <Button size="small" type="text" icon={<Icon name="edit" size={14} />} disabled={p.status === 'ARCHIVED'} onClick={() => setModal({ open: true, project: p })} />
        </Can>
        {canArchive && p.status !== 'ARCHIVED' && (
          <Popconfirm title={`Archive ${p.key}?`} description="No new tasks can be created in an archived project." okText="Archive" okButtonProps={{ danger: true }}
            onConfirm={() => archive.mutateAsync(p.id).then(() => message.success(`${p.key} archived`)).catch((e) => message.error(errorMessage(e)))}>
            <Button size="small" type="text" icon={<Icon name="archive" size={14} />} />
          </Popconfirm>
        )}
      </span>) },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Projects" count={query.data?.total}
        extra={<Can permission="project.create"><Button type="primary" size="small" icon={<Icon name="add" size={14} />} onClick={() => setModal({ open: true })}>New project</Button></Can>}>
        <FilterBar
          filters={[
            { type: 'search', key: 'search', placeholder: 'Search name or key' },
            { type: 'select', key: 'status', placeholder: 'Status', options: PROJECT_STATUS_OPTIONS },
            { type: 'user', key: 'managerId', placeholder: 'Manager' },
            { type: 'user', key: 'memberId', placeholder: 'Member' },
          ]}
          keep={['view']}
          extra={<Segmented size="small" value={view} onChange={(v) => set({ view: v === 'board' ? 'board' : undefined })}
            options={[{ value: 'list', icon: <Icon name="list" size={14} /> }, { value: 'board', icon: <Icon name="grid" size={14} /> }]} />}
        />
      </PageHeader>
      <div className="min-h-0 flex-1">
        <QueryState query={query}>
          {(data) => view === 'board' ? <ProjectsBoard items={data.items} /> : (
            <Table<ProjectListItem> className="app-table" size="middle" rowKey="id" columns={columns} dataSource={data.items}
              loading={query.isFetching} rowClassName="row-clickable" scroll={{ x: 1100 }}
              onRow={(p) => ({ onClick: () => navigate(ROUTES.project(p.key)) })}
              pagination={{ ...pagination, total: data.total }} />
          )}
        </QueryState>
      </div>
      <ProjectFormModal open={modal.open} project={modal.project} onClose={() => setModal({ open: false })} />
    </div>
  );
};
