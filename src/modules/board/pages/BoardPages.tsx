import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon } from '@hugeicons/core-free-icons';
import { Button, Select } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCurrentProject } from '@/modules/projects';
import { SprintFormModal } from '@/modules/sprints';
import { useOpenSprints, useProjectLookups } from '@/shared/api/lookups';
import { EmptyState, PageHeader, ProjectIcon } from '@/shared/components/ui';
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
  if (!project) return null;

  const active = project.active_sprint;
  if (!active) {
    return (
      <EmptyState description="No active sprint in this project">
        {canManage && project.status !== 'archived' && (
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate(ROUTES.project(project.id, 'backlog'))}>Go to backlog</Button>
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
      canCreate={canCreate && project.status !== 'archived'}
      toolbar={<span className="flex items-center gap-1.5 text-xs text-fg-2"><HugeiconsIcon icon={Rocket01Icon} size={13} className="hicon" strokeWidth={1.7} />{active.name}</span>}
    />
  );
};

/** /board — project picker (default: first active project) + sprint picker. */
export const GlobalBoardPage = () => {
  const { get, set } = useTableParams();
  const canCreate = usePermission('task.create');
  const { data: projects = [], isLoading } = useProjectLookups();
  const fallback = projects.find((p) => p.status === 'active') ?? projects[0];
  const projectId = get('project') ? Number(get('project')) : fallback?.id;
  const project = projects.find((p) => p.id === projectId);
  const { data: open = [] } = useOpenSprints(projectId);
  // No sprint in the URL → the backend's default (active sprint).
  const sprintId = get('sprint') ? Number(get('sprint')) : undefined;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Board"
        extra={
          <>
            <Select size="small" className="min-w-52" loading={isLoading} value={projectId} placeholder="Project"
              onChange={(v: number) => set({ project: v, sprint: undefined })}
              options={projects.map((p) => ({ value: p.id, label: <span className="flex items-center gap-1.5"><ProjectIcon projectKey={p.key} size={13} />{p.name}</span> }))} />
            <Select size="small" className="min-w-36" value={sprintId ?? open.find((s) => s.status === 'active')?.id} placeholder="No open sprint"
              onChange={(v: number) => set({ sprint: v })}
              options={open.map((s) => ({ value: s.id, label: `${s.name}${s.status === 'active' ? ' · active' : ''}` }))} />
          </>
        }
      />
      <div className="min-h-0 flex-1">
        {project ? (
          <BoardView key={`${projectId}-${sprintId}`} projectId={project.id} sprintId={sprintId} keep={['project', 'sprint']}
            canCreate={canCreate && project.status !== 'archived'} />
        ) : (
          !isLoading && <EmptyState description="You are not a member of any project yet" />
        )}
      </div>
    </div>
  );
};
