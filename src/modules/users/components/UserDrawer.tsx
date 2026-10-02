import { App, Button, Drawer, Form, Input, Select } from 'antd';
import { useEffect } from 'react';

import { useCurrentUser } from '@/shared/hooks';
import { ROLE_OPTIONS } from '@/shared/constants';
import { errorMessage, formatPhone, rules } from '@/shared/utils';

import { useSaveUser, useTeams } from '../hooks/useUsers';
import type { User, UserFormValues } from '../types/user.types';

export const UserDrawer = ({ open, user, onClose }: { open: boolean; user?: User; onClose: () => void }) => {
  const [form] = Form.useForm<UserFormValues>();
  const { message } = App.useApp();
  const me = useCurrentUser();
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const save = useSaveUser();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(user
      ? { full_name: user.full_name, username: user.username, email: user.email, position: user.position,
          phone: user.phone ? formatPhone(user.phone) : '', team: user.team?.id ?? null, roles: user.roles }
      : { roles: ['EMPLOYEE'], team: null });
  }, [open, user, form]);

  const roleOptions = ROLE_OPTIONS.filter((r) => me.role === 'SUPER_ADMIN' || r.value !== 'SUPER_ADMIN');

  return (
    <Drawer open={open} onClose={onClose} width={480} title={user ? `Edit ${user.full_name || user.username}` : 'New user'} destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>{user ? 'Save' : 'Create user'}</Button>
        </div>
      }>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({ user, values: { ...values, team: values.team ?? null, phone: values.phone?.replace(/\s/g, '') ?? '' } }, {
          onSuccess: () => { message.success(user ? 'User updated' : 'User created'); onClose(); },
          onError: (e) => message.error(errorMessage(e)),
        })}>
        <Form.Item name="full_name" label="Full name" rules={[rules.required('Full name')]}><Input /></Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="username" label="Username" normalize={(v: string) => v?.toLowerCase().replace(/\s/g, '')}
            rules={[rules.required('Username'), { pattern: /^[a-z0-9_.@+-]{3,150}$/, message: 'a-z, 0-9, _ . @ + - (min 3)' }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[rules.required('Email'), rules.email]}><Input /></Form.Item>
        </div>
        <Form.Item name="phone" label="Phone" rules={[rules.phone]}
          normalize={(v: string) => {
            const d = v.replace(/\D/g, '').slice(0, 12);
            const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
            return parts.length ? `+${parts.join(' ')}` : '';
          }}>
          <Input placeholder="+998 90 123 45 67" />
        </Form.Item>
        <Form.Item name="position" label="Position"><Input /></Form.Item>
        <Form.Item name="team" label="Team">
          <Select allowClear placeholder="No team" loading={teamsLoading} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
        </Form.Item>
        <Form.Item name="roles" label="Roles" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one role' }]}>
          <Select mode="multiple" options={roleOptions} disabled={user?.roles.includes('SUPER_ADMIN') && me.role !== 'SUPER_ADMIN'} />
        </Form.Item>
        <Form.Item name="password" label={user ? 'New password' : 'Password'} extra={user ? 'Leave empty to keep the current password.' : undefined}
          rules={user ? [rules.min(8)] : [rules.required('Password'), rules.min(8)]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
