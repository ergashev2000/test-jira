import { useMutation } from '@tanstack/react-query';
import { App, Button, Descriptions, Form, Input, Modal, Tag } from 'antd';
import { useState } from 'react';

import { useCurrentUser } from '@/shared/hooks';
import { PageHeader, Panel, UserAvatar } from '@/shared/components/ui';
import { primaryRole, ROLES } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import { errorMessage, formatPhone, rules } from '@/shared/utils';

import { changePassword, updateProfile } from '../api/profileApi';
import { TelegramCard } from '../components/TelegramCard';

const PasswordModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form] = Form.useForm<{ current: string; next: string; confirm: string }>();
  const { message } = App.useApp();
  const m = useMutation({ mutationFn: changePassword });
  return (
    <Modal open={open} title="Change password" onCancel={onClose} onOk={() => form.submit()} confirmLoading={m.isPending} okText="Update password" destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(v) => m.mutate({ old_password: v.current, new_password: v.next }, { onSuccess: () => { message.success('Password updated'); onClose(); }, onError: (e) => message.error(errorMessage(e)) })}>
        <Form.Item name="current" label="Current password" rules={[rules.required('Current password')]}><Input.Password /></Form.Item>
        <Form.Item name="next" label="New password" rules={[rules.required('New password'), rules.min(8)]}><Input.Password /></Form.Item>
        <Form.Item name="confirm" label="Confirm new password" dependencies={['next']} rules={[rules.required('Confirmation'), ({ getFieldValue }) => ({
          validator: (_, v) => (!v || v === getFieldValue('next') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))),
        })]}><Input.Password /></Form.Item>
      </Form>
    </Modal>
  );
};

export const ProfilePage = () => {
  const user = useCurrentUser();
  const setUser = useSessionStore((s) => s.setUser);
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form] = Form.useForm<{ full_name: string; phone: string }>();
  const role = primaryRole(user.roles);
  const save = useMutation({ mutationFn: updateProfile });

  return (
    <>
      <PageHeader title="Profile" />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-5">
        <Panel title="Personal info" extra={!editing && (
          <>
            <Button size="small" onClick={() => setPwOpen(true)}>Change password</Button>
            <Button size="small" onClick={() => { form.setFieldsValue({ full_name: user.full_name, phone: formatPhone(user.phone) }); setEditing(true); }}>Edit</Button>
          </>
        )}>
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar user={user} size={48} />
            <div>
              <div className="text-base font-semibold">{user.full_name}</div>
              <div className="text-xs text-fg-2">@{user.username} · <Tag color={ROLES[role].color}>{ROLES[role].label}</Tag></div>
            </div>
          </div>
          {editing ? (
            <Form form={form} layout="vertical" requiredMark={false}
              onFinish={(v) => save.mutate({ ...v, phone: v.phone.replace(/\s/g, '') }, {
                onSuccess: (u) => { setUser(u); message.success('Profile updated'); setEditing(false); },
                onError: (e) => message.error(errorMessage(e)),
              })}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Form.Item name="full_name" label="Full name" rules={[rules.required('Full name')]}><Input /></Form.Item>
                <Form.Item name="phone" label="Phone" rules={[rules.required('Phone'), rules.phone]}><Input placeholder="+998 90 123 45 67" /></Form.Item>
              </div>
              <div className="flex gap-2">
                <Button type="primary" htmlType="submit" loading={save.isPending}>Save</Button>
                <Button onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </Form>
          ) : (
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" colon={false} styles={{ label: { color: 'var(--c-fg-3)' } }}>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{formatPhone(user.phone)}</Descriptions.Item>
              <Descriptions.Item label="Position">{user.position}</Descriptions.Item>
              <Descriptions.Item label="Team">{user.team?.name ?? '—'}</Descriptions.Item>
            </Descriptions>
          )}
        </Panel>
        <TelegramCard />
      </div>
      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </>
  );
};
