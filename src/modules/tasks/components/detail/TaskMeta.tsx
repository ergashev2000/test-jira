import { App, DatePicker, InputNumber, Select } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useCurrentUser } from '@/shared/hooks';
import { useOpenSprints } from '@/shared/api/lookups';
import { DeadlineText, PriorityIcon, PriorityTag, ProjectIcon, UserAvatar, UserSelect } from '@/shared/components/ui';
import { PRIORITY_OPTIONS, ROUTES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type { Priority, TaskWrite } from '@/shared/types';
import { canEditTask, errorMessage, formatDateTime } from '@/shared/utils';

import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';
import { StatusDropdown } from '../StatusDropdown';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid min-h-8 grid-cols-[84px_1fr] items-center gap-2">
    <span className="text-xs text-fg-3">{label}</span>
    <div className="min-w-0 text-[13px]">{children}</div>
  </div>
);

const BACKLOG = 0;
/** The meta column is narrow — the user list opens wider so names and roles fit. */
const USER_POPUP_WIDTH = 300;

/** Right-hand property panel; every field is inline-editable for leads/managers. */
export const TaskMeta = ({ task }: { task: Task }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const update = useUpdateTask();
  const { data: sprints = [] } = useOpenSprints(task.project.id);
  const archived = task.project.status === 'archived';
  const editable = canEditTask(user) && !archived && task.status !== 'cancelled';

  const patch = (p: Partial<TaskWrite>) =>
    update.mutate({ task, patch: p }, { onSuccess: () => message.success('Saved'), onError: (e) => message.error(errorMessage(e)) });

  const inline = 'chip-select w-full max-w-full';

  return (
    <div className="flex flex-col gap-0.5">
      <Row label="Status">
        <StatusDropdown task={task} disabled={archived} />
      </Row>
      <Row label="Assignee">
        {editable ? (
          <UserSelect size="small" variant="borderless" className={inline} value={task.assignee?.id} popupMatchSelectWidth={USER_POPUP_WIDTH}
            projectId={task.project.id} initial={task.assignee ? [task.assignee] : []} placeholder="Unassigned"
            onChange={(v) => patch({ assignee: (v as number | undefined) ?? null })} />
        ) : (
          <UserAvatar user={task.assignee} showName />
        )}
      </Row>
      <Row label="Reporter"><UserAvatar user={task.reporter} showName wrap /></Row>
      <Row label="Reviewer">
        {editable ? (
          <UserSelect size="small" variant="borderless" className={inline} value={task.reviewer?.id} popupMatchSelectWidth={USER_POPUP_WIDTH}
            projectId={task.project.id} initial={task.reviewer ? [task.reviewer] : []} placeholder="No reviewer"
            onChange={(v) => patch({ reviewer: (v as number | undefined) ?? null })} />
        ) : (
          task.reviewer ? <UserAvatar user={task.reviewer} showName /> : <span className="text-fg-3">—</span>
        )}
      </Row>
      <Row label="Priority">
        {editable ? (
          <Select size="small" variant="borderless" className={inline} value={task.priority} popupMatchSelectWidth={false}
            onChange={(v: Priority) => patch({ priority: v })}
            options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: <span className="flex items-center gap-1.5"><PriorityIcon priority={o.value} size={12} />{o.label}</span> }))} />
        ) : (
          <PriorityTag priority={task.priority} />
        )}
      </Row>
      <Row label="Project">
        <Link to={ROUTES.project(task.project.id)} className="inline-flex max-w-full min-w-0 items-center gap-1.5 !text-fg" title={task.project.name}>
          <ProjectIcon projectKey={task.project.key} size={14} />
          <span className="min-w-0 truncate">{task.project.name}</span>
        </Link>
      </Row>
      <Row label="Sprint">
        {editable && task.sprint?.status !== 'completed' ? (
          <Select size="small" variant="borderless" className={inline} value={task.sprint?.id ?? BACKLOG} popupMatchSelectWidth={false}
            onChange={(v: number) => patch({ sprint: v === BACKLOG ? null : v })}
            options={[{ value: BACKLOG, label: 'Backlog' }, ...sprints.map((s) => ({ value: s.id, label: s.name }))]} />
        ) : (
          <span className="block min-w-0 truncate text-fg-2" title={task.sprint?.name ?? 'Backlog'}>
            {task.sprint?.name ?? 'Backlog'}
          </span>
        )}
      </Row>
      <Row label="Deadline">
        {editable ? (
          <DatePicker size="small" variant="borderless" format="DD.MM.YYYY" className="!px-1.5"
            value={task.deadline ? dayjs(task.deadline) : null} status={task.is_overdue ? 'error' : undefined}
            onChange={(d) => patch({ deadline: d ? d.format('YYYY-MM-DD') : null })} />
        ) : (
          <DeadlineText task={task} />
        )}
      </Row>
      <Row label="Estimate">
        {editable ? (
          <InputNumber size="small" variant="borderless" min={0} step={0.5} suffix="h" className="!w-24"
            value={task.estimate == null ? null : Number(task.estimate)} onBlur={(e) => {
              const v = e.target.value === '' ? null : Number(e.target.value.replace('h', ''));
              if (v !== (task.estimate == null ? null : Number(task.estimate)) && (v === null || !Number.isNaN(v))) patch({ estimate: v == null ? null : String(v) });
            }} />
        ) : (
          <span>{task.estimate ? `${Number(task.estimate)}h0` : '—'}</span>
        )}
      </Row>
      <Row label="Labels">
        {editable ? (
          <Select size="small" mode="tags" variant="borderless" className="w-full" value={task.labels ?? []} placeholder="Add labels"
            onChange={(v: string[]) => patch({ labels: v })} />
        ) : task.labels?.length ? (
          <div className="flex min-w-0 flex-wrap gap-1">
            {task.labels.map((l) => (
              <span key={l} className="max-w-full truncate rounded-full border border-line px-2 text-xs text-fg-2" title={l}>
                {l}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-fg-3">—</span>
        )}
      </Row>
      <div className="my-2 border-t border-line" />
      <Row label="Created"><span className="block truncate text-xs text-fg-2" title={formatDateTime(task.created_at)}>{formatDateTime(task.created_at)}</span></Row>
      <Row label="Updated"><span className="block truncate text-xs text-fg-2" title={formatDateTime(task.updated_at)}>{formatDateTime(task.updated_at)}</span></Row>
      {task.completed_at && <Row label="Completed"><span className="block truncate text-xs text-fg-2" title={formatDateTime(task.completed_at)}>{formatDateTime(task.completed_at)}</span></Row>}
    </div>
  );
};
