import { HugeiconsIcon } from '@hugeicons/react';
import { Analytics01Icon } from '@hugeicons/core-free-icons';
import { Alert, App, DatePicker, Form, Input, Modal, Radio, Select, Statistic } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/constants';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import { errorMessage, rules } from '@/shared/utils';

import type { Sprint } from '../api/sprintsApi';
import { useCompleteSprint, useCompletionPreview, useCreateSprint, useLastSprint, useSprint, useUpdateSprint } from '../hooks/useSprints';

const DEFAULT_DURATION_DAYS = 14;

interface FormShape { name: string; goal: string; range: [Dayjs, Dayjs] }

export const SprintFormModal = ({ open, projectId, sprint, onClose }: {
  open: boolean; projectId: number; sprint?: Sprint; onClose: () => void;
}) => {
  const [form] = Form.useForm<FormShape>();
  const { message } = App.useApp();
  const last = useLastSprint(projectId, open && !sprint);
  // Edit works on a fresh copy: GET /sprints/:id/.
  const detail = useSprint(open ? sprint?.id : undefined);
  const current = detail.data ?? sprint;
  const activeSprint = current?.status === 'active';
  const create = useCreateSprint();
  const update = useUpdateSprint();

  useEffect(() => {
    if (!open) return;
    if (current) {
      form.setFieldsValue({ name: current.name, goal: current.goal, range: [dayjs(current.start_date), dayjs(current.end_date)] });
    } else if (last.data) {
      const { count, last: prev } = last.data;
      const start = prev && dayjs(prev.end_date).isAfter(dayjs()) ? dayjs(prev.end_date).add(1, 'day') : dayjs();
      form.setFieldsValue({ name: `Sprint ${count + 1}`, goal: '', range: [start, start.add(DEFAULT_DURATION_DAYS - 1, 'day')] });
    }
  }, [open, current, last.data, form]);

  const submit = ({ name, goal, range }: FormShape) => {
    const body = {
      project: projectId,
      name,
      goal: goal ?? '',
      start_date: activeSprint && current ? current.start_date : range[0].format('YYYY-MM-DD'),
      end_date: range[1].format('YYYY-MM-DD'),
    };
    const opts = { onSuccess: () => { message.success(sprint ? 'Sprint updated' : `${name} created`); onClose(); }, onError: (e: unknown) => message.error(errorMessage(e)) };
    if (sprint) update.mutate({ id: sprint.id, body }, opts);
    else create.mutate(body, opts);
  };

  return (
    <Modal open={open} title={sprint ? `Edit ${sprint.name}` : 'Create sprint'} onCancel={onClose} onOk={() => form.submit()}
      okText={sprint ? 'Save' : 'Create sprint'} confirmLoading={create.isPending || update.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item name="name" label="Name" rules={[rules.required('Name')]}><Input /></Form.Item>
        <Form.Item name="goal" label="Goal"><Input.TextArea rows={3} placeholder="What should this sprint achieve?" /></Form.Item>
        <Form.Item name="range" label="Dates" rules={[rules.required('Dates')]}>
          <DatePicker.RangePicker format="DD.MM.YYYY" className="w-full" disabled={[!!activeSprint, false]} />
        </Form.Item>
        {activeSprint && <div className="-mt-3 mb-3 text-xs text-fg-3">The start date cannot be changed after the sprint starts.</div>}
        {current && <div className="text-xs text-fg-3">Status: {current.status}</div>}
      </Form>
    </Modal>
  );
};

export const CompleteSprintModal = ({ sprint, onClose }: { sprint: Sprint | null; onClose: () => void }) => {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const preview = useCompletionPreview(sprint);
  const complete = useCompleteSprint();
  const [mode, setMode] = useState<'BACKLOG' | 'NEXT'>('BACKLOG');
  const [next, setNext] = useState<number>();
  const nextSprints = preview.next.data?.results ?? [];
  const unfinishedTasks = preview.unfinished.data?.results ?? [];

  useEffect(() => {
    setMode('BACKLOG');
    setNext(undefined);
  }, [sprint]);

  const submit = () => {
    if (!sprint) return;
    const moveTo = mode === 'NEXT' && next ? next : 'backlog';
    complete.mutate({ id: sprint.id, moveTo }, {
      onSuccess: (report) => {
        onClose();
        modal.success({
          title: `${sprint.name} completed`,
          content: `Completion: ${report.completion_percent}%. ${report.unfinished} unfinished task(s) moved. A sprint report was generated.`,
          okText: 'View report',
          onOk: () => navigate(`${ROUTES.REPORTS}?type=sprint&projectId=${sprint.project.id}&sprintId=${sprint.id}`),
          closable: true,
        });
      },
      onError: (e) => message.error(errorMessage(e)),
    });
  };

  return (
    <Modal open={!!sprint} title={`Complete ${sprint?.name ?? ''}`} onCancel={onClose} onOk={submit} okText="Complete sprint"
      confirmLoading={complete.isPending} okButtonProps={{ disabled: preview.isLoading || (mode === 'NEXT' && !next) }} destroyOnHidden>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line p-3"><Statistic title="Completed" value={preview.report.data?.completed ?? 0} valueStyle={{ color: '#4cb782' }} /></div>
        <div className="rounded-xl border border-line p-3"><Statistic title="Unfinished" value={preview.report.data?.unfinished ?? 0} valueStyle={{ color: '#f2994a' }} /></div>
      </div>
      {!!preview.report.data?.unfinished && (
        <>
          <div className="mb-2 text-fg-2">Move unfinished tasks to:</div>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} className="!flex !flex-col gap-2">
            <Radio value="BACKLOG">Backlog</Radio>
            <Radio value="NEXT" disabled={!nextSprints.length}>
              Next sprint {!nextSprints.length && <span className="text-fg-3">(no planned sprint)</span>}
            </Radio>
          </Radio.Group>
          {mode === 'NEXT' && (
            <Select className="!mt-2 w-full" placeholder="Select sprint" value={next} onChange={setNext}
              options={nextSprints.map((s) => ({ value: s.id, label: s.name }))} />
          )}
          <ul className="mt-3 mb-0 max-h-40 list-none overflow-auto rounded-md border border-line p-2 text-xs">
            {unfinishedTasks.map((t) => <li key={t.id} className="py-0.5"><span className="font-mono text-fg-3">{t.key}</span> {t.title}</li>)}
          </ul>
        </>
      )}
      <Alert className="!mt-4" type="info" showIcon icon={<HugeiconsIcon icon={Analytics01Icon} size={16} className="hicon" strokeWidth={1.7} />} message="A sprint report snapshot will be created automatically." />
    </Modal>
  );
};
