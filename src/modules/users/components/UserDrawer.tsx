import { App, Button, Drawer, Form, Input, Select } from 'antd';
import { useEffect } from 'react';

import { useTeams } from '@/modules/teams';
import { ROLE_OPTIONS } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import { errorMessage, formatPhone, rules } from '@/shared/utils';

import type { UserFormValues, UserRow } from '../api/usersApi';
import { useSaveUser } from '../hooks/useUsers';

export const UserDrawer = ({ open, user, onClose }: { open: boolean; user?: UserRow; onClose: () => void }) => {
  const [form] = Form.useForm<UserFormValues>();
  const { message } = App.useApp();
  const me = useSessionStore((s) => s.user)!;
  const { data: teams = [] } = useTeams();
  const save = useSaveUser();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(user ? { ...user, phone: formatPhone(user.phone) } : { role: 'EMPLOYEE', status: 'ACTIVE', teamId: null, phone: '+998 ' });
  }, [open, user, form]);

  const roleOptions = ROLE_OPTIONS.filter((r) => me.role === 'SUPER_ADMIN' || r.value !== 'SUPER_ADMIN');

  return (
    <Drawer open={open} onClose={onClose} width={480} title={user ? `Edit ${user.fullName}` : 'New user'} destroyOnHidden
      extra={<Button type="primary" loading={save.isPending} onClick={() => form.submit()}>{user ? 'Save' : 'Create user'}</Button>}>
      <Form form={form} layout="vertical" requiredMark={false}
        onFinish={(values) => save.mutate({ id: user?.id, values: { ...values, teamId: values.teamId ?? null } }, {
          onSuccess: () => { message.success(user ? 'User updated' : 'User created'); onClose(); },
          onError: (e) => message.error(errorMessage(e)),
        })}>
        <Form.Item name="fullName" label="Full name" rules={[rules.required('Full name')]}><Input /></Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="username" label="Username" normalize={(v: string) => v?.toLowerCase().replace(/\s/g, '')}
            rules={[rules.required('Username'), { pattern: /^[a-z0-9_.]{3,}$/, message: 'a-z, 0-9, _ . (min 3)' }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[rules.required('Email'), rules.email]}><Input /></Form.Item>
        </div>
        <Form.Item name="phone" label="Phone" rules={[rules.required('Phone'), rules.phone]}
          normalize={(v: string) => {
            const d = v.replace(/\D/g, '').slice(0, 12);
            const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
            return parts.length ? `+${parts.join(' ')}` : '';
          }}>
          <Input placeholder="+998 90 123 45 67" />
        </Form.Item>
        <Form.Item name="position" label="Position" rules={[rules.required('Position')]}><Input /></Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="teamId" label="Team"><Select allowClear placeholder="No team" options={teams.map((t) => ({ value: t.id, label: t.name }))} /></Form.Item>
          <Form.Item name="role" label="Role" rules={[rules.required('Role')]}>
            <Select options={roleOptions} disabled={user?.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN'} />
          </Form.Item>
        </div>
        {!user && (
          <Form.Item name="password" label="Password" rules={[rules.required('Password'), rules.min(6)]}><Input.Password /></Form.Item>
        )}
        <Form.Item name="status" label="Status">
          <Select options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
