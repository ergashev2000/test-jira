import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, Rocket01Icon } from '@hugeicons/core-free-icons';
import { Button, Progress, Tag } from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useCurrentProject } from '@/modules/projects';
import { TaskTable, useTaskList } from '@/modules/tasks';
import { useProjectLookups } from '@/shared/api/lookups';
import { Can, EmptyState, ErrorState, FilterBar, PageHeader, PageLoader, ProjectIcon } from '@/shared/components/ui';
import { PRIORITY_OPTIONS, ROUTES, SPRINT_STATUS, SPRINT_STATUS_OPTIONS, STATUS_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import type { Priority, SprintStatus, TaskStatus } from '@/shared/types';
import { formatDate, percent } from '@/shared/utils';

import { SprintActions } from '../components/SprintActions';
import { CompleteSprintModal, SprintFormModal } from '../components/SprintModals';
import { SprintsTable } from '../components/SprintsTable';
import { useSprint, useSprints } from '../hooks/useSprints';

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

/** /sprints/:sprintId — one sprint with its tasks, opened from the global Sprints page. */
export const SprintDetailPage = () => {
  const sprintId = Number(useParams().sprintId);
  const { get, getArray, page, pageSize, ordering } = useTableParams();
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const sprintQuery = useSprint(sprintId || undefined);
  const sprint = sprintQuery.data;
  const active = useSprints({ project: sprint?.project.id, status: 'active', page_size: 1 }, !!sprint);
  const tasks = useTaskList({
    sprint: sprintId, page, page_size: pageSize, ordering: ordering ?? 'key', search: get('search'),
    status: getArray('status') as TaskStatus[], priority: getArray('priority') as Priority[],
  }, { enabled: !!sprintId });

  if (sprintQuery.isLoading) return <PageLoader />;
  if (sprintQuery.isError) return <ErrorState error={sprintQuery.error} onRetry={() => sprintQuery.refetch()} />;
  if (!sprint) return <EmptyState description="Sprint not found" />;

  const done = sprint.tasks_done ?? 0;
  const total = sprint.tasks_total ?? 0;
  const hasActive = (active.data?.results ?? []).some((s) => s.id !== sprint.id);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Sprints', to: ROUTES.SPRINTS }]}
        icon={<HugeiconsIcon icon={Rocket01Icon} size={14} className="hicon text-fg-2" strokeWidth={1.7} />}
        title={sprint.name}
        count={tasks.data?.count}
        extra={<SprintActions sprint={sprint} hasActive={hasActive} onEdit={() => setEditing(true)} onComplete={() => setCompleting(true)} />}
      >
        <FilterBar filters={[
          { type: 'search', key: 'search', placeholder: 'Search by key or title' },
          { type: 'select', key: 'status', placeholder: 'Status', multiple: true, options: STATUS_OPTIONS, width: 140 },
          { type: 'select', key: 'priority', placeholder: 'Priority', multiple: true, options: PRIORITY_OPTIONS, width: 130 },
        ]} />
      </PageHeader>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-5 py-3 text-[13px]">
        <Tag color={SPRINT_STATUS[sprint.status].color} className="!m-0">{SPRINT_STATUS[sprint.status].label}</Tag>
        <Link to={ROUTES.project(sprint.project.id, 'overview')} className="flex items-center gap-1.5 !text-fg-2 hover:!text-fg">
          <ProjectIcon projectKey={sprint.project.key} size={14} />{sprint.project.name}
        </Link>
        <span className="text-fg-2">{formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}</span>
        <span className="flex items-center gap-2">
          <Progress percent={percent(done, total)} size="small" showInfo={false} className="!m-0 w-28" strokeColor="#165dff" />
          <span className="text-xs tabular-nums text-fg-2">{done}/{total} done</span>
        </span>
        {sprint.goal && <span className="basis-full text-fg-2">{sprint.goal}</span>}
      </div>
      <div className="px-5 py-3">
        <TaskTable query={tasks} emptyText="No tasks in this sprint" hideProject />
      </div>
      <SprintFormModal open={editing} projectId={sprint.project.id} sprint={sprint} onClose={() => setEditing(false)} />
      <CompleteSprintModal sprint={completing ? sprint : null} onClose={() => setCompleting(false)} />
    </>
  );
};
