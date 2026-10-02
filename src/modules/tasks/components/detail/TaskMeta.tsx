import { App, DatePicker, InputNumber, Select } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useCurrentUser } from '@/shared/hooks';
import { useOpenSprints } from '@/shared/api/lookups';
import { DeadlineText, PriorityIcon, PriorityTag, ProjectIcon, UserAvatar, UserSelect } from '@/shared/components/ui';
import { PRIORITY_OPTIONS, ROUTES } from '@/shared/constants';
import dayjs from '@/shared/lib/dayjs';
import type { Priority } from '@/shared/types';
import { canEditTask, errorMessage, formatDateTime, isOverdue } from '@/shared/utils';

import { useUpdateTask } from '../../hooks/useTasks';
import type { TaskDetail, TaskFormValues } from '../../types/task.types';
import { StatusDropdown } from '../StatusDropdown';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid min-h-8 grid-cols-[96px_1fr] items-center gap-2">
    <span className="text-xs text-fg-3">{label}</span>
    <div className="min-w-0 text-[13px]">{children}</div>
  </div>
);

const BACKLOG = '__backlog__';

/** Right-hand property panel; every field is inline-editable for leads/managers. */
export const TaskMeta = ({ task }: { task: TaskDetail }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const update = useUpdateTask();
  const { data: sprints = [] } = useOpenSprints(task.projectId);
  const editable = canEditTask(user) && !task.projectArchived && task.status !== 'CANCELLED';

  const patch = (p: Partial<TaskFormValues>) =>
    update.mutate({ id: task.id, patch: p }, { onSuccess: () => message.success('Saved'), onError: (e) => message.error(errorMessage(e)) });

  const inline = 'chip-select w-full max-w-56';

  return (
    <div className="flex flex-col gap-0.5">
      <Row label="Status">
        <StatusDropdown task={task} disabled={task.projectArchived} />
      </Row>
      <Row label="Assignee">
        {editable ? (
          <UserSelect size="small" variant="borderless" className={inline} value={task.assigneeId ?? undefined}
            projectId={task.projectId} includeIds={task.assigneeId ? [task.assigneeId] : []} placeholder="Unassigned"
            onChange={(v) => patch({ assigneeId: (v as string | undefined) ?? null })} />
        ) : (
          <UserAvatar userId={task.assigneeId} showName />
        )}
      </Row>
      <Row label="Reporter"><UserAvatar userId={task.reporterId} showName /></Row>
      <Row label="Reviewer">
        {editable ? (
          <UserSelect size="small" variant="borderless" className={inline} value={task.reviewerId ?? undefined}
            projectId={task.projectId} includeIds={task.reviewerId ? [task.reviewerId] : []} placeholder="No reviewer"
            onChange={(v) => patch({ reviewerId: (v as string | undefined) ?? null })} />
        ) : (
          task.reviewerId ? <UserAvatar userId={task.reviewerId} showName /> : <span className="text-fg-3">—</span>
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
        <Link to={ROUTES.project(task.projectKey)} className="inline-flex items-center gap-1.5 !text-fg">
          <ProjectIcon projectKey={task.projectKey} size={14} />{task.projectName}
        </Link>
      </Row>
      <Row label="Sprint">
        {editable && task.sprintStatus !== 'COMPLETED' ? (
          <Select size="small" variant="borderless" className={inline} value={task.sprintId ?? BACKLOG} popupMatchSelectWidth={false}
            onChange={(v: string) => patch({ sprintId: v === BACKLOG ? null : v })}
            options={[{ value: BACKLOG, label: 'Backlog' }, ...sprints.map((s) => ({ value: s.id, label: s.name }))]} />
        ) : (
          <span className="text-fg-2">{task.sprintName ?? 'Backlog'}</span>
        )}
      </Row>
      <Row label="Deadline">
        {editable ? (
          <DatePicker size="small" variant="borderless" format="DD.MM.YYYY" className="!px-1.5"
            value={task.deadline ? dayjs(task.deadline) : null} status={isOverdue(task) ? 'error' : undefined}
            onChange={(d) => patch({ deadline: d ? d.format('YYYY-MM-DD') : null })} />
        ) : (
          <DeadlineText task={task} />
        )}
      </Row>
      <Row label="Estimate">
        {editable ? (
          <InputNumber size="small" variant="borderless" min={0} step={0.5} suffix="h" className="!w-24"
            value={task.estimate} onBlur={(e) => {
              const v = e.target.value === '' ? null : Number(e.target.value.replace('h', ''));
              if (v !== task.estimate && (v === null || !Number.isNaN(v))) patch({ estimate: v });
            }} />
        ) : (
          <span>{task.estimate ? `${task.estimate}h` : '—'}</span>
        )}
      </Row>
      <Row label="Labels">
        {editable ? (
          <Select size="small" mode="tags" variant="borderless" className="w-full" value={task.labels} placeholder="Add labels"
            onChange={(v: string[]) => patch({ labels: v })} />
        ) : task.labels.length ? (
          <div className="flex flex-wrap gap-1">{task.labels.map((l) => <span key={l} className="rounded-full border border-line px-2 text-xs text-fg-2">{l}</span>)}</div>
        ) : (
          <span className="text-fg-3">—</span>
        )}
      </Row>
      <div className="my-2 border-t border-line" />
      <Row label="Created"><span className="text-xs text-fg-2">{formatDateTime(task.createdAt)}</span></Row>
      <Row label="Updated"><span className="text-xs text-fg-2">{formatDateTime(task.updatedAt)}</span></Row>
      {task.completedAt && <Row label="Completed"><span className="text-xs text-fg-2">{formatDateTime(task.completedAt)}</span></Row>}
    </div>
  );
};
