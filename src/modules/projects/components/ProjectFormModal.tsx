import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, UserCircleIcon, UserMultipleIcon } from '@hugeicons/core-free-icons';
import { App, Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import { useEffect, useRef } from 'react';

import { ProjectIcon, UserSelect } from '@/shared/components/ui';
import { PROJECT_STATUS, PROJECT_STATUS_OPTIONS } from '@/shared/constants';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import type { ProjectStatus, ProjectWrite } from '@/shared/types';
import { errorMessage, rules, suggestProjectKey } from '@/shared/utils';

import { useProject, useProjectMembers, useSaveProject } from '../hooks/useProjects';
import type { Project } from '../types/project.types';

/** ProjectWrite with Dayjs dates + the member picker. */
type Shape = Omit<ProjectWrite, 'start_date' | 'end_date'> & { start_date: Dayjs; end_date: Dayjs | null; member_ids: number[] };

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onSaved?: (p: Project) => void;
}

const StatusDot = ({ s }: { s: ProjectStatus }) => (
  <span className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ background: { planning: '#8a8f98', active: '#f2c94c', on_hold: '#f2994a', completed: '#165dff', archived: '#6b6f76' }[s] }} />
    {PROJECT_STATUS[s].label}
  </span>
);

/** Linear "New project" dialog: icon tile, big name, summary key, property chips, brief. */
export const ProjectFormModal = ({ open, onClose, project: listItem, onSaved }: Props) => {
  const [form] = Form.useForm<Shape>();
  const { message } = App.useApp();
  const save = useSaveProject();
  // Edit works on a fresh copy: GET /projects/{id}/ + /projects/{id}/members/.
  const detail = useProject(open ? listItem?.id : undefined);
  const project = detail.data ?? listItem;
  const members = useProjectMembers(open ? listItem?.id : undefined);
  const memberList = members.data?.results ?? [];
  const keyTouched = useRef(false);
  const key = Form.useWatch('key', form);
  const startDate = Form.useWatch('start_date', form);

  useEffect(() => {
    if (!open) return;
    keyTouched.current = !!project;
    form.resetFields();
    if (project) {
      form.setFieldsValue({
        name: project.name, key: project.key, description: project.description, status: project.status, manager: project.manager.id,
        start_date: project.start_date ? dayjs(project.start_date) : dayjs(), end_date: project.end_date ? dayjs(project.end_date) : null,
        member_ids: memberList.map((m) => m.id).filter((id) => id !== project.manager.id),
      });
    } else {
      form.setFieldsValue({ status: 'planning', start_date: dayjs(), end_date: null, member_ids: [], description: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project, form, members.data]);

  const submit = (v: Shape) => {
    const { member_ids: memberIds = [], ...fields } = v;
    const body: ProjectWrite = {
      ...fields,
      description: fields.description ?? '',
      start_date: fields.start_date.format('YYYY-MM-DD'),
      end_date: fields.end_date ? fields.end_date.format('YYYY-MM-DD') : null,
    };
    save.mutate({ project, body, memberIds, currentIds: memberList.map((m) => m.id) }, {
      onSuccess: (p) => { message.success(project ? 'Project updated' : `Project ${p.key} created`); onSaved?.(p); onClose(); },
      onError: (e) => message.error(errorMessage(e)),
    });
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
          <HugeiconsIcon icon={ArrowRight01Icon} size={11} className="hicon" strokeWidth={1.7} />
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
              options={PROJECT_STATUS_OPTIONS.filter((o) => o.value !== 'archived').map((o) => ({ value: o.value, label: <StatusDot s={o.value} /> }))} />
          </Form.Item>
          <Form.Item name="manager" noStyle rules={[rules.required('Lead')]}>
            <UserSelect size="small" variant="filled" className="chip-select min-w-36" popupMatchSelectWidth={false} allowClear={false}
              roles={['PROJECT_MANAGER', 'TEAM_LEAD', 'ADMIN', 'SUPER_ADMIN']} initial={project ? [project.manager] : []} placeholder={<span className="flex items-center gap-1"><HugeiconsIcon icon={UserCircleIcon} size={13} className="hicon" strokeWidth={1.7} /> Lead</span>} />
          </Form.Item>
          <Form.Item name="member_ids" noStyle>
            <UserSelect size="small" variant="filled" mode="multiple" maxTagCount="responsive" className="chip-select min-w-40"
              popupMatchSelectWidth={260} initial={memberList} placeholder={<span className="flex items-center gap-1"><HugeiconsIcon icon={UserMultipleIcon} size={13} className="hicon" strokeWidth={1.7} /> Members</span>} />
          </Form.Item>
          <Form.Item name="start_date" noStyle rules={[rules.required('Start date')]}>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Start" allowClear={false} />
          </Form.Item>
          <Form.Item name="end_date" noStyle dependencies={['start_date']}
            rules={[({ getFieldValue }) => ({ validator: (_, v: Dayjs | null) =>
              !v || !v.isBefore(getFieldValue('start_date'), 'day') ? Promise.resolve() : Promise.reject(new Error('Target must be after start')) })]}>
            <DatePicker size="small" variant="filled" className="chip-picker" format="DD.MM.YYYY" placeholder="Target"
              disabledDate={(d) => !!startDate && d.isBefore(startDate, 'day')} />
          </Form.Item>
        </div>
        <Form.Item noStyle shouldUpdate>{() => {
          const errs = form.getFieldsError(['manager', 'end_date', 'start_date']).flatMap((e) => e.errors);
          return errs.length ? <div className="mt-2 text-xs text-danger">{errs.join(' · ')}</div> : null;
        }}</Form.Item>

        <Form.Item name="description" className="!mt-4">
          <Input.TextArea className="ghost-input !text-[14px]" autoSize={{ minRows: 8, maxRows: 16 }}
            placeholder="Write a description, a project brief, or collect ideas…" />
        </Form.Item>

        <div className="-mx-6 flex justify-end gap-2 border-t border-line px-6 pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
