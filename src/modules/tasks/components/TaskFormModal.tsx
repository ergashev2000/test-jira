import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Calendar03Icon, Clock01Icon, Rocket01Icon, Tag01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';

import { useEffect, useState } from 'react';

import { useOpenSprints, useProjectLookups } from '@/shared/api/lookups';
import { PriorityIcon, ProjectIcon, TaskTypeIcon, UserSelect } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import type { Task, TaskWrite } from '@/shared/types';
import { errorMessage, rules } from '@/shared/utils';

import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
/** TaskWrite with antd-friendly values: Dayjs deadline, numeric estimate, sentinel for "no sprint". */
type FormShape = Omit<TaskWrite, 'deadline' | 'sprint' | 'estimate'> & { deadline: Dayjs | null; sprint: number | typeof BACKLOG; estimate: number | null };

const BACKLOG = 0;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit mode when provided. */
  task?: Task;
  defaults?: Partial<TaskWrite>;
  onCreated?: (task: Task) => void;
}

/** Linear-style create/edit dialog: big title, description, property chips. */
export const TaskFormModal = ({ open, onClose, task, defaults, onCreated }: Props) => {
  const [form] = Form.useForm<FormShape>();
  const { message } = App.useApp();
  const [createMore, setCreateMore] = useState(false);
  const projectId = Form.useWatch('project', form);
  const deadline = Form.useWatch('deadline', form);
  const { data: projects = [] } = useProjectLookups();
  const { data: sprints = [] } = useOpenSprints(projectId);
  const create = useCreateTask();
  const update = useUpdateTask();
  const writableProjects = projects.filter((p) => p.status !== 'archived');

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(task ? {
      project: task.project.id,
      type: task.type,
      title: task.title,
      description: task.description,
      sprint: task.sprint?.id ?? BACKLOG,
      assignee: task.assignee?.id ?? null,
      reviewer: task.reviewer?.id ?? null,
      priority: task.priority,
      deadline: task.deadline ? dayjs(task.deadline) : null,
      estimate: task.estimate == null ? null : Number(task.estimate),
      labels: task.labels ?? [],
    } : {
      project: defaults?.project ?? writableProjects[0]?.id,
      type: defaults?.type ?? 'task',
      title: defaults?.title ?? '',
      description: defaults?.description ?? '',
      sprint: defaults?.sprint ?? BACKLOG,
      assignee: defaults?.assignee ?? null,
      reviewer: defaults?.reviewer ?? null,
      priority: defaults?.priority ?? 'medium',
      deadline: defaults?.deadline ? dayjs(defaults.deadline) : null,
      estimate: null,
      labels: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  const submit = (v: FormShape) => {
    const values: TaskWrite = {
      ...v,
      description: v.description ?? '',
      sprint: v.sprint === BACKLOG ? null : v.sprint,
      deadline: v.deadline ? v.deadline.format('YYYY-MM-DD') : null,
      estimate: v.estimate == null ? null : String(v.estimate),
      assignee: v.assignee ?? null,
      reviewer: v.reviewer ?? null,
    };
    if (task) {
      const { project: _ignored, ...patch } = values;
      void _ignored;
      update.mutate(
        { task, patch },
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
          <Form.Item name="project" noStyle rules={[rules.required('Project')]}>
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
              onChange={() => form.setFieldsValue({ sprint: BACKLOG, assignee: null, reviewer: null })}
            />
          </Form.Item>
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} className="hicon" strokeWidth={1.7} />
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
              { value: 'task', label: <span className="flex items-center gap-1.5"><TaskTypeIcon type="task" size={12} />Task</span> },
              { value: 'bug', label: <span className="flex items-center gap-1.5"><TaskTypeIcon type="bug" size={12} />Bug</span> },
            ]} />
          </Form.Item>
          <Form.Item name="priority" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false}
              options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: <span className="flex items-center gap-1.5"><PriorityIcon priority={o.value} size={12} />{o.label}</span> }))} />
          </Form.Item>
          <Form.Item name="sprint" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false}
              prefix={<HugeiconsIcon icon={Rocket01Icon} size={16} className="hicon text-fg-3" strokeWidth={1.7} />}
              options={[{ value: BACKLOG, label: 'Backlog' }, ...sprints.map((s) => ({ value: s.id, label: `${s.name}${s.status === 'active' ? ' · active' : ''}` }))]} />
          </Form.Item>
          <Form.Item name="assignee" noStyle>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false}
              projectId={projectId} placeholder={<span><HugeiconsIcon icon={UserIcon} size={16} className="hicon" strokeWidth={1.7} /> Assignee</span>}
              initial={task?.assignee ? [task.assignee] : []} />
          </Form.Item>
          <Form.Item name="reviewer" noStyle>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false}
              projectId={projectId} initial={task?.reviewer ? [task.reviewer] : []} placeholder={<span><HugeiconsIcon icon={UserIcon} size={16} className="hicon" strokeWidth={1.7} /> Reviewer</span>} />
          </Form.Item>
          <Form.Item name="deadline" noStyle>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Deadline"
              suffixIcon={<HugeiconsIcon icon={Calendar03Icon} size={16} className="hicon" strokeWidth={1.7} />} status={pastDeadline ? 'warning' : undefined} />
          </Form.Item>
          <Form.Item name="estimate" noStyle>
            <InputNumber size="small" variant="filled" className="chip-picker !w-28" min={0} step={0.5} placeholder="Estimate"
              prefix={<HugeiconsIcon icon={Clock01Icon} size={16} className="hicon text-fg-3" strokeWidth={1.7} />} suffix="h" />
          </Form.Item>
          <Form.Item name="labels" noStyle>
            <Select size="small" variant="filled" mode="tags" className="chip-select min-w-32" placeholder={<span><HugeiconsIcon icon={Tag01Icon} size={16} className="hicon" strokeWidth={1.7} /> Labels</span>}
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
