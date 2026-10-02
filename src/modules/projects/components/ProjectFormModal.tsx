import { App, Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import { useEffect, useRef } from 'react';

import { Icon, ProjectIcon, UserSelect } from '@/shared/components/ui';
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS } from '@/shared/constants';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import type { ProjectStatus } from '@/shared/types';
import { errorMessage, rules, suggestProjectKey } from '@/shared/utils';

import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import type { ProjectFormValues, ProjectListItem } from '../types/project.types';

type Shape = Omit<ProjectFormValues, 'startDate' | 'endDate'> & { startDate: Dayjs; endDate: Dayjs | null };

interface Props {
  open: boolean;
  onClose: () => void;
  project?: ProjectListItem;
  onSaved?: (p: ProjectListItem) => void;
}

const StatusDot = ({ s }: { s: ProjectStatus }) => (
  <span className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: { PLANNING: '#8a8f98', ACTIVE: '#f2c94c', ON_HOLD: '#f2994a', COMPLETED: '#165dff', ARCHIVED: '#6b6f76' }[s] }} />
    {PROJECT_STATUS[s].label}
  </span>
);

/** Linear "New project" dialog: icon tile, big name, summary key, property chips, brief. */
export const ProjectFormModal = ({ open, onClose, project, onSaved }: Props) => {
  const [form] = Form.useForm<Shape>();
  const { message } = App.useApp();
  const create = useCreateProject();
  const update = useUpdateProject();
  const keyTouched = useRef(false);
  const key = Form.useWatch('key', form);
  const startDate = Form.useWatch('startDate', form);

  useEffect(() => {
    if (!open) return;
    keyTouched.current = !!project;
    form.resetFields();
    if (project) {
      form.setFieldsValue({ ...project, startDate: dayjs(project.startDate), endDate: project.endDate ? dayjs(project.endDate) : null });
    } else {
      form.setFieldsValue({ status: 'PLANNING', startDate: dayjs(), endDate: null, memberIds: [], description: '' });
    }
  }, [open, project, form]);

  const submit = (v: Shape) => {
    const values: ProjectFormValues = {
      ...v,
      description: v.description ?? '',
      memberIds: v.memberIds ?? [],
      startDate: v.startDate.format('YYYY-MM-DD'),
      endDate: v.endDate ? v.endDate.format('YYYY-MM-DD') : null,
    };
    const opts = {
      onSuccess: (p: ProjectListItem) => { message.success(project ? 'Project updated' : `Project ${p.key} created`); onSaved?.(p); onClose(); },
      onError: (e: unknown) => message.error(errorMessage(e)),
    };
    if (project) {
      const { key: _k, ...rest } = values;
      void _k;
      update.mutate({ id: project.id, values: rest }, opts);
    } else create.mutate(values, opts);
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={900} title={null} destroyOnHidden>
      <Form form={form} onFinish={submit} requiredMark={false}
        onValuesChange={(changed: Partial<Shape>) => {
          if ('key' in changed) keyTouched.current = true;
          if ('name' in changed && !keyTouched.current) form.setFieldValue('key', suggestProjectKey(changed.name ?? ''));
        }}>
        <div className="mb-5 flex items-center gap-2 text-xs text-fg-2">
          <span className="rounded-md border border-line px-2 py-0.5">Workspace</span>
          <Icon name="arrowRight" size={11} />
          <span className="text-fg">{project ? `Edit ${project.key}` : 'New project'}</span>
        </div>

        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-surface-2">
          <ProjectIcon projectKey={key || 'NEW'} size={18} />
        </div>

        <Form.Item name="name" rules={[rules.required('Project name')]} className="!mb-0">
          <Input className="ghost-input !text-[26px] !font-semibold" placeholder="Project name" autoFocus />
        </Form.Item>
        <div className="mb-4 flex items-center gap-2 text-fg-3">
          <span className="text-xs">Key</span>
          <Form.Item name="key" className="!mb-0" normalize={(v: string) => v?.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}
            rules={[rules.required('Key'), rules.projectKey]}>
            <Input disabled={!!project} size="small" variant="filled" className="!w-24 font-mono" placeholder="CRM"
              title={project ? "Key can't change — task IDs are built from it" : undefined} />
          </Form.Item>
          <span className="text-xs">Tasks will be numbered {key || 'KEY'}-1, {key || 'KEY'}-2…</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-4">
          <Form.Item name="status" noStyle>
            <Select size="small" variant="filled" className="chip-select" popupMatchSelectWidth={false}
              options={PROJECT_STATUS_OPTIONS.filter((o) => o.value !== 'ARCHIVED').map((o) => ({ value: o.value, label: <StatusDot s={o.value} /> }))} />
          </Form.Item>
          <Form.Item name="managerId" noStyle rules={[rules.required('Lead')]}>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false} allowClear={false}
              roles={['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN']} placeholder={<span className="flex items-center gap-1"><Icon name="userCircle" size={13} /> Lead</span>} />
          </Form.Item>
          <Form.Item name="memberIds" noStyle>
            <UserSelect size="small" variant="filled" mode="multiple" maxTagCount="responsive" className="chip-select min-w-40"
              popupMatchSelectWidth={260} placeholder={<span className="flex items-center gap-1"><Icon name="users" size={13} /> Members</span>} />
          </Form.Item>
          <Form.Item name="startDate" noStyle rules={[rules.required('Start date')]}>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Start" allowClear={false} />
          </Form.Item>
          <Form.Item name="endDate" noStyle dependencies={['startDate']}
            rules={[({ getFieldValue }) => ({ validator: (_, v: Dayjs | null) =>
              !v || !v.isBefore(getFieldValue('startDate'), 'day') ? Promise.resolve() : Promise.reject(new Error('Target must be after start')) })]}>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Target"
              disabledDate={(d) => !!startDate && d.isBefore(startDate, 'day')} />
          </Form.Item>
        </div>
        <Form.Item noStyle shouldUpdate>{() => {
          const errs = form.getFieldsError(['managerId', 'endDate', 'startDate']).flatMap((e) => e.errors);
          return errs.length ? <div className="mt-2 text-xs text-danger">{errs.join(' · ')}</div> : null;
        }}</Form.Item>

        <Form.Item name="description" className="!mt-4">
          <Input.TextArea className="ghost-input !text-[14px]" autoSize={{ minRows: 8, maxRows: 16 }}
            placeholder="Write a description, a project brief, or collect ideas…" />
        </Form.Item>

        <div className="-mx-6 flex justify-end gap-2 border-t border-line px-6 pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
