import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { App, Button, Collapse, Dropdown, Input, Tag } from 'antd';
import { useState, type ReactNode } from 'react';

import { useCurrentProject } from '@/modules/projects';
import { TaskFormModal, TaskListRow, useAllTaskList, useCreateTask, useMoveTask, useProjectBacklog, type Task } from '@/modules/tasks';
import { EmptyState, QueryState } from '@/shared/components/ui';
import { SPRINT_STATUS } from '@/shared/constants';
import { usePermission } from '@/shared/hooks';
import { cn, errorMessage, formatDate } from '@/shared/utils';

import type { Sprint } from '../api/sprintsApi';
import { SprintActions } from '../components/SprintActions';
import { CompleteSprintModal, SprintFormModal } from '../components/SprintModals';
import { useSprints } from '../hooks/useSprints';

type Target = { id: number | null; name: string };

/** Drop zone ids: `sprint:<id>` / `sprint-head:<id>` (the collapse header) or `backlog`. */
const dropTarget = (id: string | number | undefined): number | null | undefined => {
  if (id === 'backlog') return null;
  const m = /^sprint(?:-head)?:(\d+)$/.exec(String(id ?? ''));
  return m ? Number(m[1]) : undefined;
};

const DropZone = ({ id, disabled, className, children }: { id: string; disabled?: boolean; className?: string; children: ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return <div ref={setNodeRef} className={cn('transition-colors', isOver && 'bg-primary/10 ring-1 ring-inset ring-primary/40', className)}>{children}</div>;
};

/** A task row that can be dragged to another sprint or the backlog (a click still opens it). */
const DraggableRow = ({ task, actions, disabled }: { task: Task; actions?: ReactNode; disabled: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task }, disabled });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={cn('touch-none outline-none', !disabled && 'active:[&_*]:!cursor-grabbing', isDragging && 'opacity-30')}>
      <TaskListRow task={task} actions={actions} />
    </div>
  );
};

const MoveMenu = ({ task, targets }: { task: Task; targets: Target[] }) => {
  const { message } = App.useApp();
  const move = useMoveTask();
  const options = targets.filter((t) => t.id !== (task.sprint?.id ?? null));
  return (
    <Dropdown trigger={['click']} menu={{
      items: [{ key: 'label', type: 'group', label: 'Move to', children: options.map((t) => ({ key: String(t.id ?? 'backlog'), label: t.name })) }],
      onClick: ({ key }) => move.mutate({ id: task.id, sprint: key === 'backlog' ? null : Number(key) }, {
        onSuccess: () => message.success(`${task.key} moved`), onError: (e) => message.error(errorMessage(e)) }),
    }}>
      <Button size="small" type="text" icon={<HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="hicon" strokeWidth={1.7} />} className="opacity-60 group-hover:opacity-100" />
    </Dropdown>
  );
};

const InlineCreate = ({ projectId, disabled }: { projectId: number; disabled: boolean }) => {
  const { message } = App.useApp();
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  if (disabled) return null;
  return (
    <div className="flex items-center gap-2 border-t border-line px-5 py-1.5">
      <HugeiconsIcon icon={Add01Icon} size={14} className="hicon text-fg-3" strokeWidth={1.7} />
      <Input variant="borderless" placeholder="Create task — type a title and press Enter" value={title} disabled={create.isPending}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={() => title.trim() && create.mutate(
          { project: projectId, title: title.trim(), type: 'task', sprint: null, priority: 'medium' },
          { onSuccess: (t) => { setTitle(''); message.success(`${t.key} created`); }, onError: (e) => message.error(errorMessage(e)) })} />
    </div>
  );
};

/** Tasks assigned to one sprint. */
const useSectionTasks = (project: number, sprint: number) =>
  useAllTaskList({ project, sprint, ordering: 'priority_order' });

const TaskRows = ({ tasks, total, actions, draggable }: { tasks: Task[]; total: number; actions: (t: Task) => ReactNode; draggable: boolean }) =>
  tasks.length ? (
    <>
      {tasks.map((t) => <DraggableRow key={t.id} task={t} actions={actions(t)} disabled={!draggable} />)}
      {total > tasks.length && <div className="px-5 py-2 text-xs text-fg-3">Showing {tasks.length} of {total} — use the board filters to narrow down.</div>}
    </>
  ) : <div className="px-5 py-4 text-xs text-fg-3">No tasks — move some here from the backlog.</div>;

const SprintTasks = ({ project, sprint, actions, draggable }: { project: number; sprint: number; actions: (t: Task) => ReactNode; draggable: boolean }) => {
  const query = useSectionTasks(project, sprint);
  return (
    <DropZone id={`sprint:${sprint}`} disabled={!draggable}>
      <QueryState query={query} skeletonRows={2}>{(d) => <TaskRows tasks={d.results} total={d.count} actions={actions} draggable={draggable} />}</QueryState>
    </DropZone>
  );
};

export const BacklogTab = () => {
  const { data: project } = useCurrentProject();
  const canEdit = usePermission('task.edit');
  const canCreate = usePermission('task.create');
  const canManageSprints = usePermission('sprint.manage');
  const sprints = useSprints({ project: project?.id, status: ['active', 'planned'], ordering: 'start_date', page_size: 50 }, !!project);
  const backlog = useProjectBacklog(project?.id);
  const [sprintModal, setSprintModal] = useState<{ open: boolean; sprint?: Sprint }>({ open: false });
  const [completing, setCompleting] = useState<Sprint | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dragging, setDragging] = useState<Task | null>(null);
  const { message } = App.useApp();
  const move = useMoveTask();
  // Pointer only — Enter on a row opens the task; keyboard users move via the row's "Move to" menu.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  if (!project) return null;

  const archived = project.status === 'archived';
  const open = sprints.data?.results ?? [];
  const hasActive = open.some((s) => s.status === 'active');
  const targets: Target[] = [...open.map((s) => ({ id: s.id, name: s.name })), { id: null, name: 'Backlog' }];
  const actions = (t: Task) => (canEdit && !archived ? <MoveMenu task={t} targets={targets} /> : undefined);
  const backlogCount = backlog.data?.count ?? 0;
  const draggable = canEdit && !archived;

  // While dragging the pointer leaves the row, so the grabbing cursor is set on the whole page.
  const endDrag = () => { setDragging(null); document.body.style.cursor = ''; };
  const onDragStart = (e: DragStartEvent) => {
    setDragging((e.active.data.current?.task as Task) ?? null);
    document.body.style.cursor = 'grabbing';
  };
  const onDragEnd = (e: DragEndEvent) => {
    endDrag();
    const task = e.active.data.current?.task as Task | undefined;
    const sprint = dropTarget(e.over?.id);
    if (!task || sprint === undefined || sprint === (task.sprint?.id ?? null)) return;
    const name = targets.find((t) => t.id === sprint)?.name ?? 'Backlog';
    move.mutate({ id: task.id, sprint }, {
      onSuccess: () => message.success(`${task.key} moved to ${name}`), onError: (err) => message.error(errorMessage(err)) });
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <span className="text-fg-2">{open.length} open sprint(s) · {backlogCount} in backlog</span>
        <div className="ml-auto flex gap-2">
          {canCreate && <Button size="small" disabled={archived} icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setCreateOpen(true)}>New task</Button>}
          {canManageSprints && <Button size="small" type="primary" disabled={archived} onClick={() => setSprintModal({ open: true })}>Create sprint</Button>}
        </div>
      </div>
      <QueryState query={{ ...backlog, isLoading: backlog.isLoading || sprints.isLoading }}>
        {() => (
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={endDrag}>
            {open.length > 0 && (
              <Collapse
                defaultActiveKey={open.map((s) => s.id)}
                className="!rounded-xl !border-line !bg-surface"
                items={open.map((s) => ({
                  key: s.id,
                  styles: { body: { padding: 0 } },
                  label: (
                    <DropZone id={`sprint-head:${s.id}`} disabled={!draggable} className="-mx-1 rounded-md px-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <Tag color={SPRINT_STATUS[s.status].color} className="!m-0">{SPRINT_STATUS[s.status].label}</Tag>
                        <span className="text-xs text-fg-3">{formatDate(s.start_date)} — {formatDate(s.end_date)} · {s.tasks_total ?? 0} tasks</span>
                      </span>
                    </DropZone>
                  ),
                  extra: !archived && <SprintActions sprint={s} hasActive={hasActive} onEdit={() => setSprintModal({ open: true, sprint: s })} onComplete={() => setCompleting(s)} />,
                  children: <SprintTasks project={project.id} sprint={s.id} actions={actions} draggable={draggable} />,
                }))}
              />
            )}
            <section className="overflow-hidden rounded-xl border border-line bg-surface">
              <header className="flex h-11 items-center gap-2 border-b border-line px-5">
                <span className="font-medium">Backlog</span>
                <span className="text-xs text-fg-3">{backlogCount}</span>
              </header>
              <DropZone id="backlog" disabled={!draggable}>
                {backlogCount ? <TaskRows tasks={backlog.data?.results ?? []} total={backlogCount} actions={actions} draggable={draggable} /> : <EmptyState description="Backlog is empty" />}
              </DropZone>
              {canCreate && <InlineCreate projectId={project.id} disabled={archived} />}
            </section>
            <DragOverlay dropAnimation={null}>
              {dragging && <div className="rounded-md border border-line bg-surface shadow-lg [&_*]:!cursor-grabbing"><TaskListRow task={dragging} /></div>}
            </DragOverlay>
          </DndContext>
        )}
      </QueryState>
      <SprintFormModal open={sprintModal.open} projectId={project.id} sprint={sprintModal.sprint} onClose={() => setSprintModal({ open: false })} />
      <CompleteSprintModal sprint={completing} onClose={() => setCompleting(null)} />
      <TaskFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaults={{ project: project.id }} />
    </div>
  );
};
