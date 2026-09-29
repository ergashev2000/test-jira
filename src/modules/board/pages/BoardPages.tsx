import { Button, Select } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCurrentProject } from '@/modules/projects';
import { SprintFormModal, useSprints } from '@/modules/sprints';
import { useProjectLookups } from '@/shared/api/lookups';
import { EmptyState, Icon, PageHeader, ProjectIcon } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import { usePermission, useTableParams } from '@/shared/hooks';

import { BoardView } from '../components/BoardView';

/** Project → Board tab: active sprint only. */
export const ProjectBoardTab = () => {
  const { data: project } = useCurrentProject();
  const canCreate = usePermission('task.create');
  const canManage = usePermission('sprint.manage');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const sprints = useSprints({ projectId: project?.id }, !!project);
  if (!project || sprints.isLoading) return null;

  const active = sprints.data?.find((s) => s.status === 'ACTIVE');
  if (!active) {
    return (
      <EmptyState description="No active sprint in this project">
        {canManage && project.status !== 'ARCHIVED' && (
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate(ROUTES.project(project.key, 'backlog'))}>Go to backlog</Button>
            <Button type="primary" onClick={() => setOpen(true)}>Start a sprint</Button>
          </div>
        )}
        <SprintFormModal open={open} projectId={project.id} onClose={() => setOpen(false)} />
      </EmptyState>
    );
  }
  return (
    <BoardView
      projectId={project.id}
      sprintId={active.id}
      canCreate={canCreate && project.status !== 'ARCHIVED'}
      toolbar={<span className="flex items-center gap-1.5 text-xs text-fg-2"><Icon name="sprint" size={13} />{active.name}</span>}
    />
  );
};

/** /board — project picker (default: first active project) + sprint picker. */
export const GlobalBoardPage = () => {
  const { get, set } = useTableParams();
  const canCreate = usePermission('task.create');
  const { data: projects = [], isLoading } = useProjectLookups();
  const fallback = projects.find((p) => p.status === 'ACTIVE') ?? projects[0];
  const projectId = get('projectId') ?? fallback?.id;
  const project = projects.find((p) => p.id === projectId);
  const sprints = useSprints({ projectId }, !!projectId);
  const open = (sprints.data ?? []).filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNED');
  const sprintId = get('sprintId') ?? open.find((s) => s.status === 'ACTIVE')?.id ?? 'active';

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Board"
        extra={
          <>
            <Select size="small" className="min-w-52" loading={isLoading} value={projectId} placeholder="Project"
              onChange={(v: string) => set({ projectId: v, sprintId: undefined })}
              options={projects.map((p) => ({ value: p.id, label: <span className="flex items-center gap-1.5"><ProjectIcon projectKey={p.key} size={13} />{p.name}</span> }))} />
            <Select size="small" className="min-w-36" value={sprintId} onChange={(v: string) => set({ sprintId: v })}
              options={open.length ? open.map((s) => ({ value: s.id, label: `${s.name}${s.status === 'ACTIVE' ? ' · active' : ''}` })) : [{ value: 'active', label: 'No open sprint' }]} />
          </>
        }
      />
      <div className="min-h-0 flex-1">
        {project ? (
          <BoardView key={`${projectId}-${sprintId}`} projectId={project.id} sprintId={sprintId} keep={['projectId', 'sprintId']}
            canCreate={canCreate && project.status !== 'ARCHIVED'} />
        ) : (
          !isLoading && <EmptyState description="You are not a member of any project yet" />
        )}
      </div>
    </div>
  );
};
