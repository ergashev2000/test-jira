import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { Icon } from '@/shared/components/ui/Icon';
import { useEffect, useState } from 'react';

import { useOpenSprints, useProjectLookups } from '@/shared/api/lookups';
import { PriorityIcon, ProjectIcon, TaskTypeIcon, UserSelect } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import type { Priority, TaskType } from '@/shared/types';
import { errorMessage, rules } from '@/shared/utils';

import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import type { TaskFormValues, TaskRow } from '../types/task.types';

type FormShape = Omit<TaskFormValues, 'deadline' | 'sprintId'> & { deadline: Dayjs | null; sprintId: string };

const BACKLOG = '__backlog__';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit mode when provided. */
  task?: TaskRow;
  defaults?: Partial<TaskFormValues>;
  onCreated?: (task: TaskRow) => void;
}

/** Linear-style create/edit dialog: big title, description, property chips. */
export const TaskFormModal = ({ open, onClose, task, defaults, onCreated }: Props) => {
  const [form] = Form.useForm<FormShape>();
  const { message } = App.useApp();
  const [createMore, setCreateMore] = useState(false);
  const projectId = Form.useWatch('projectId', form);
  const deadline = Form.useWatch('deadline', form);
  const { data: projects = [] } = useProjectLookups();
  const { data: sprints = [] } = useOpenSprints(projectId);
  const create = useCreateTask();
  const update = useUpdateTask();
  const writableProjects = projects.filter((p) => p.status !== 'ARCHIVED');

  useEffect(() => {
    if (!open) return;
    const src = task ?? defaults ?? {};
    form.setFieldsValue({
      projectId: src.projectId ?? writableProjects[0]?.id,
      type: (src.type ?? 'TASK') as TaskType,
      title: src.title ?? '',
      description: src.description ?? '',
      sprintId: src.sprintId ?? BACKLOG,
      assigneeId: src.assigneeId ?? null,
      reviewerId: src.reviewerId ?? null,
      priority: (src.priority ?? 'MEDIUM') as Priority,
      deadline: src.deadline ? dayjs(src.deadline) : null,
      estimate: src.estimate ?? null,
      labels: src.labels ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const submit = (v: FormShape) => {
    const values: TaskFormValues = {
      ...v,
      description: v.description ?? '',
      sprintId: v.sprintId === BACKLOG ? null : v.sprintId,
      deadline: v.deadline ? v.deadline.format('YYYY-MM-DD') : null,
      assigneeId: v.assigneeId ?? null,
      reviewerId: v.reviewerId ?? null,
    };
    if (task) {
      const { projectId: _ignored, ...patch } = values;
      void _ignored;
      update.mutate(
        { id: task.id, patch },
        { onSuccess: () => { message.success(`${task.key} updated`); onClose(); }, onError: (e) => message.error(errorMessage(e)) },
      );
      return;
    }
    create.mutate(values, {
      onSuccess: (t) => {
        message.success(`${t.key} created`);
        onCreated?.(t);
        if (createMore) form.setFieldsValue({ title: '', description: '' });
        else onClose();
      },
      onError: (e) => message.error(errorMessage(e)),
    });
  };

  const project = projects.find((p) => p.id === projectId);
  const pastDeadline = !!deadline && deadline.isBefore(dayjs(), 'day');

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={760} destroyOnHidden title={null} className="linear-modal">
      <Form form={form} onFinish={submit} requiredMark={false} className="flex flex-col">
        <div className="mb-4 flex items-center gap-2 text-xs text-fg-2">
          <Form.Item name="projectId" noStyle rules={[rules.required('Project')]}>
            <Select
              disabled={!!task}
              variant="filled"
              size="small"
              className="chip-select min-w-40"
              popupMatchSelectWidth={false}
              placeholder="Project"
              options={writableProjects.map((p) => ({
                value: p.id,
                label: <span className="flex items-center gap-1.5"><ProjectIcon projectKey={p.key} size={13} />{p.name}</span>,
              }))}
              onChange={() => form.setFieldsValue({ sprintId: BACKLOG, assigneeId: null, reviewerId: null })}
            />
          </Form.Item>
          <Icon name="arrowRight" size={11} />
          <span className="text-fg">{task ? `Edit ${task.key}` : 'New task'}</span>
        </div>

        <Form.Item name="title" rules={[rules.required('Title'), rules.max(200)]} className="!mb-1">
          <Input className="ghost-input !text-[22px] !font-medium" placeholder={project ? `${project.key} task title` : 'Task title'} autoFocus />
        </Form.Item>
        <Form.Item name="description" className="!mb-3">
          <Input.TextArea className="ghost-input !text-[14px] !text-fg-2" rows={6} placeholder="Add description…" />
        </Form.Item>

        <div className="flex flex-wrap items-center gap-1.5">
          <Form.Item name="type" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false} options={[
              { value: 'TASK', label: <span className="flex items-center gap-1.5"><TaskTypeIcon type="TASK" size={12} />Task</span> },
              { value: 'BUG', label: <span className="flex items-center gap-1.5"><TaskTypeIcon type="BUG" size={12} />Bug</span> },
            ]} />
          </Form.Item>
          <Form.Item name="priority" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false}
              options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: <span className="flex items-center gap-1.5"><PriorityIcon priority={o.value} size={12} />{o.label}</span> }))} />
          </Form.Item>
          <Form.Item name="sprintId" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false}
              prefix={<Icon name="sprint" className="text-fg-3" />}
              options={[{ value: BACKLOG, label: 'Backlog' }, ...sprints.map((s) => ({ value: s.id, label: `${s.name}${s.status === 'ACTIVE' ? ' · active' : ''}` }))]} />
          </Form.Item>
          <Form.Item name="assigneeId" noStyle>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false}
              projectId={projectId} placeholder={<span><Icon name="user" /> Assignee</span>}
              includeIds={task?.assigneeId ? [task.assigneeId] : []} />
          </Form.Item>
          <Form.Item name="reviewerId" noStyle>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false}
              projectId={projectId} placeholder={<span><Icon name="user" /> Reviewer</span>} />
          </Form.Item>
          <Form.Item name="deadline" noStyle>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Deadline"
              suffixIcon={<Icon name="calendar" />} status={pastDeadline ? 'warning' : undefined} />
          </Form.Item>
          <Form.Item name="estimate" noStyle>
            <InputNumber size="small" variant="filled" className="chip-picker !w-28" min={0} step={0.5} placeholder="Estimate"
              prefix={<Icon name="clock" className="text-fg-3" />} suffix="h" />
          </Form.Item>
          <Form.Item name="labels" noStyle>
            <Select size="small" variant="filled" mode="tags" className="chip-select min-w-32" placeholder={<span><Icon name="tag" /> Labels</span>}
              tokenSeparators={[',']} options={['frontend', 'backend', 'bug', 'ui', 'qa', 'docs', 'devops'].map((l) => ({ value: l, label: l }))} />
          </Form.Item>
        </div>
        {pastDeadline && <div className="mt-2 text-xs text-warn">Heads up: the selected deadline is in the past.</div>}

        <div className="-mx-6 mt-6 flex items-center gap-3 border-t border-line px-6 pt-4">
          {!task && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-fg-2">
              <Switch size="small" checked={createMore} onChange={setCreateMore} /> Create more
            </label>
          )}
          <div className="ml-auto flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};
