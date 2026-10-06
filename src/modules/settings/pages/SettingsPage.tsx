import { App, Button, Checkbox, Form, Input, InputNumber, Select, Switch, Tabs, TimePicker } from 'antd';
import { useEffect, type ReactNode } from 'react';

import { PageHeader, QueryState } from '@/shared/components/ui';
import { PRIORITY_OPTIONS } from '@/shared/constants';
import { useTableParams } from '@/shared/hooks';
import dayjs, { type Dayjs } from '@/shared/lib/dayjs';
import type { AppSettings } from '@/shared/types';
import { errorMessage, rules } from '@/shared/utils';

import type { SettingsSection } from '../api/settingsApi';
import { useAppSettings, useUpdateSettings } from '../hooks/useSettings';

const TIMEZONES = ['Asia/Tashkent', 'Asia/Almaty', 'Europe/Moscow', 'Europe/Istanbul', 'Europe/London', 'UTC'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((l, i) => ({ label: l, value: i + 1 }));
const t = (v: string) => dayjs(v, 'HH:mm');
const f = (v: Dayjs) => v.format('HH:mm');

const Section = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <div className="max-w-xl">
    <h2 className="m-0 text-base font-medium">{title}</h2>
    {description && <p className="mt-1 mb-6 text-fg-2">{description}</p>}
    {children}
  </div>
);

const useSave = <S extends SettingsSection>(section: S) => {
  const { message } = App.useApp();
  const m = useUpdateSettings(section);
  return {
    loading: m.isPending,
    save: (v: AppSettings[S]) => m.mutate(v, { onSuccess: () => message.success('Settings saved'), onError: (e) => message.error(errorMessage(e)) }),
  };
};

const GeneralForm = ({ s }: { s: AppSettings['general'] }) => {
  const [form] = Form.useForm();
  const { save, loading } = useSave('general');
  useEffect(() => form.setFieldsValue({ ...s, work_start: t(s.work_start), work_end: t(s.work_end) }), [s, form]);
  return (
    <Form form={form} layout="vertical" onFinish={(v) => save({ ...v, work_start: f(v.work_start), work_end: f(v.work_end) })}>
      <Form.Item name="company_name" label="Company name" rules={[rules.required('Company name')]}><Input /></Form.Item>
      <Form.Item name="timezone" label="Timezone"><Select options={TIMEZONES.map((z) => ({ value: z, label: z }))} /></Form.Item>
      <Form.Item name="working_days" label="Working days" rules={[{ type: 'array', min: 1, message: 'Pick at least one day' }]}>
        <Checkbox.Group options={DAYS} />
      </Form.Item>
      <div className="grid grid-cols-2 gap-4">
        <Form.Item name="work_start" label="Work start time" rules={[rules.required('Start time')]}><TimePicker format="HH:mm" className="w-full" minuteStep={5} /></Form.Item>
        <Form.Item name="work_end" label="Work end time" dependencies={['work_start']} rules={[rules.required('End time'), ({ getFieldValue }) => ({
          validator: (_, v: Dayjs | undefined) => !v || v.isAfter(getFieldValue('work_start')) ? Promise.resolve() : Promise.reject(new Error('End must be after start')),
        })]}><TimePicker format="HH:mm" className="w-full" minuteStep={5} /></Form.Item>
      </div>
      <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
    </Form>
  );
};

const TelegramForm = ({ s }: { s: AppSettings['telegram'] }) => {
  const [form] = Form.useForm();
  const { save, loading } = useSave('telegram');
  useEffect(() => form.setFieldsValue({
    morning_time: t(s.morning_time), reminders_time: s.reminders_time ? t(s.reminders_time) : undefined, evening_time: t(s.evening_time),
  }), [s, form]);
  return (
    <Form form={form} layout="vertical" onFinish={(v) => save({
      ...s, morning_time: f(v.morning_time), reminders_time: v.reminders_time ? f(v.reminders_time) : undefined, evening_time: f(v.evening_time),
    })}>
      {s.bot_username && <Form.Item label="Bot username"><Input value={`@${s.bot_username}`} readOnly disabled /></Form.Item>}
      <div className="grid grid-cols-3 gap-4">
        <Form.Item name="morning_time" label="Morning plan" rules={[rules.required('Time')]}><TimePicker format="HH:mm" className="w-full" /></Form.Item>
        <Form.Item name="reminders_time" label="Reminders"><TimePicker format="HH:mm" className="w-full" /></Form.Item>
        <Form.Item name="evening_time" label="Evening report" rules={[rules.required('Time')]}><TimePicker format="HH:mm" className="w-full" /></Form.Item>
      </div>
      <Form.Item><Checkbox checked disabled>Send only on working days</Checkbox></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
    </Form>
  );
};

const TasksForm = ({ s }: { s: AppSettings['tasks'] }) => {
  const [form] = Form.useForm();
  const { save, loading } = useSave('tasks');
  useEffect(() => form.setFieldsValue(s), [s, form]);
  return (
    <Form form={form} layout="vertical" onFinish={save}>
      <Form.Item name="default_priority" label="Default priority"><Select options={PRIORITY_OPTIONS} /></Form.Item>
      <Form.Item name="require_review" label="Require review before Done" valuePropName="checked"
        extra="Tasks moved to Done go to Review first; only reviewer / lead / manager can approve."><Switch /></Form.Item>
      <Form.Item name="max_attachment_mb" label="Max attachment size (MB)" extra="Fixed on the server"><InputNumber disabled /></Form.Item>
      <Form.Item name="allowed_file_types" label="Allowed file types" extra="Fixed on the server"><Select mode="tags" disabled /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
    </Form>
  );
};

const SprintForm = ({ s }: { s: AppSettings['sprint'] }) => {
  const [form] = Form.useForm();
  const { save, loading } = useSave('sprint');
  useEffect(() => form.setFieldsValue(s), [s, form]);
  return (
    <Form form={form} layout="vertical" onFinish={save}>
      <Form.Item name="default_duration_days" label="Default sprint duration (days)" rules={[rules.required('Duration')]}>
        <InputNumber min={1} max={30} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
    </Form>
  );
};

export const SettingsPage = () => {
  const { get, set } = useTableParams();
  const query = useAppSettings();
  const tab = get('tab') ?? 'general';
  return (
    <>
      <PageHeader title="Settings" />
      <div className="px-5 py-2">
        <QueryState query={query}>
          {(s) => (
            <Tabs
              tabPosition="left"
              activeKey={tab}
              onChange={(k) => set({ tab: k })}
              items={[
                { key: 'general', label: 'General', children: <Section title="General" description="Company-wide defaults."><GeneralForm s={s.general} /></Section> },
                { key: 'telegram', label: 'Telegram', children: <Section title="Telegram bot" description="Daily plan reminders and evening reports."><TelegramForm s={s.telegram} /></Section> },
                { key: 'tasks', label: 'Tasks', children: <Section title="Tasks" description="Workflow and attachment rules."><TasksForm s={s.tasks} /></Section> },
                { key: 'sprint', label: 'Sprint', children: <Section title="Sprint"><SprintForm s={s.sprint} /></Section> },
              ]}
            />
          )}
        </QueryState>
      </div>
    </>
  );
};
