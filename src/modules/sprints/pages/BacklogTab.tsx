import { App, Button, Collapse, Dropdown, Input, Tag } from 'antd';
import { useState } from 'react';

import { useCurrentProject } from '@/modules/projects';
import { TaskFormModal, TaskListRow, useCreateTask, useMoveTask, useTaskList, type TaskRow } from '@/modules/tasks';
import { EmptyState, Icon, QueryState } from '@/shared/components/ui';
import { SPRINT_STATUS } from '@/shared/constants';
import { usePermission } from '@/shared/hooks';
import { errorMessage, formatDate } from '@/shared/utils';

import type { SprintRow } from '../api/sprintsApi';
import { SprintActions } from '../components/SprintActions';
import { CompleteSprintModal, SprintFormModal } from '../components/SprintModals';
import { useSprints } from '../hooks/useSprints';

const MoveMenu = ({ task, targets }: { task: TaskRow; targets: { id: string | null; name: string }[] }) => {
  const { message } = App.useApp();
  const move = useMoveTask();
  const options = targets.filter((t) => t.id !== task.sprintId);
  return (
    <Dropdown trigger={['click']} menu={{
      items: [{ key: 'label', type: 'group', label: 'Move to', children: options.map((t) => ({ key: t.id ?? 'backlog', label: t.name })) }],
      onClick: ({ key }) => move.mutate({ id: task.id, sprintId: key === 'backlog' ? null : key }, {
        onSuccess: () => message.success(`${task.key} moved`), onError: (e) => message.error(errorMessage(e)) }),
    }}>
      <Button size="small" type="text" icon={<Icon name="more" size={16} />} className="opacity-60 group-hover:opacity-100" />
    </Dropdown>
  );
};

const InlineCreate = ({ projectId, disabled }: { projectId: string; disabled: boolean }) => {
  const { message } = App.useApp();
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  if (disabled) return null;
  return (
    <div className="flex items-center gap-2 border-t border-line px-5 py-1.5">
      <Icon name="add" size={14} className="text-fg-3" />
      <Input variant="borderless" placeholder="Create task — type a title and press Enter" value={title} disabled={create.isPending}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={() => title.trim() && create.mutate(
          { projectId, title, type: 'TASK', description: '', sprintId: null, assigneeId: null, reviewerId: null, priority: 'MEDIUM', deadline: null, estimate: null, labels: [] },
          { onSuccess: (t) => { setTitle(''); message.success(`${t.key} created`); }, onError: (e) => message.error(errorMessage(e)) })} />
    </div>
  );
};

export const BacklogTab = () => {
  const { data: project } = useCurrentProject();
  const canEdit = usePermission('task.edit');
  const canCreate = usePermission('task.create');
  const canManageSprints = usePermission('sprint.manage');
  const sprints = useSprints({ projectId: project?.id }, !!project);
  const tasks = useTaskList({ projectId: project?.id }, { enabled: !!project });
  const [sprintModal, setSprintModal] = useState<{ open: boolean; sprint?: SprintRow }>({ open: false });
  const [completing, setCompleting] = useState<SprintRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  if (!project) return null;

  const archived = project.status === 'ARCHIVED';
  const open = (sprints.data ?? []).filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNED');
  const hasActive = open.some((s) => s.status === 'ACTIVE');
  const targets = [...open.map((s) => ({ id: s.id as string | null, name: s.name })), { id: null, name: 'Backlog' }];
  const all = tasks.data?.items ?? [];
  const rows = (list: TaskRow[]) =>
    list.length ? list.map((t) => <TaskListRow key={t.id} task={t} actions={canEdit && !archived ? <MoveMenu task={t} targets={targets} /> : undefined} />)
      : <div className="px-5 py-4 text-xs text-fg-3">No tasks — move some here from the backlog.</div>;

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <span className="text-fg-2">{open.length} open sprint(s) · {all.filter((t) => !t.sprintId).length} in backlog</span>
        <div className="ml-auto flex gap-2">
          {canCreate && <Button size="small" disabled={archived} icon={<Icon name="add" size={14} />} onClick={() => setCreateOpen(true)}>New task</Button>}
          {canManageSprints && <Button size="small" type="primary" disabled={archived} onClick={() => setSprintModal({ open: true })}>Create sprint</Button>}
        </div>
      </div>
      <QueryState query={{ ...tasks, isLoading: tasks.isLoading || sprints.isLoading }}>
        {() => (
          <>
            {open.length > 0 && (
              <Collapse
                defaultActiveKey={open.map((s) => s.id)}
                className="!rounded-xl !border-line !bg-surface"
                items={open.map((s) => {
                  const list = all.filter((t) => t.sprintId === s.id);
                  return {
                    key: s.id,
                    styles: { body: { padding: 0 } },
                    label: (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <Tag color={SPRINT_STATUS[s.status].color} className="!m-0">{SPRINT_STATUS[s.status].label}</Tag>
                        <span className="text-xs text-fg-3">{formatDate(s.startDate)} — {formatDate(s.endDate)} · {list.length} tasks</span>
                      </span>
                    ),
                    extra: !archived && <SprintActions sprint={s} hasActive={hasActive} onEdit={() => setSprintModal({ open: true, sprint: s })} onComplete={() => setCompleting(s)} />,
                    children: rows(list),
                  };
                })}
              />
            )}
            <section className="overflow-hidden rounded-xl border border-line bg-surface">
              <header className="flex h-11 items-center gap-2 border-b border-line px-5">
                <span className="font-medium">Backlog</span>
                <span className="text-xs text-fg-3">{all.filter((t) => !t.sprintId).length}</span>
              </header>
              {all.some((t) => !t.sprintId) ? rows(all.filter((t) => !t.sprintId)) : <EmptyState description="Backlog is empty" />}
              {canCreate && <InlineCreate projectId={project.id} disabled={archived} />}
            </section>
          </>
        )}
      </QueryState>
      <SprintFormModal open={sprintModal.open} projectId={project.id} sprint={sprintModal.sprint} onClose={() => setSprintModal({ open: false })} />
      <CompleteSprintModal sprint={completing} onClose={() => setCompleting(null)} />
      <TaskFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaults={{ projectId: project.id }} />
    </div>
  );
};
