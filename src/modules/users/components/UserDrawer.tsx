import { App, Button, Drawer, Form, Input, Select } from 'antd';
import { HugeiconsIcon } from '@hugeicons/react';
import { MagicWand01Icon } from '@hugeicons/core-free-icons';
import { useEffect, useState } from 'react';

import { useCurrentUser } from '@/shared/hooks';
import { ROLE_OPTIONS } from '@/shared/constants';
import { errorMessage, rules } from '@/shared/utils';

import { useSaveUser } from '../hooks/useUsers';
import type { User, UserFormValues } from '../types/user.types';

const PHONE_PREFIX = '+998';

/** `+998 XX XXX XX XX` — the +998 prefix is fixed; accepts typed or pasted numbers with or without it. */
const maskPhone = (v = '') => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.length ? [PHONE_PREFIX, ...parts].join(' ') : `${PHONE_PREFIX} `;
};

/** Masked value → API value (`+998901234567`), or '' when only the prefix is there. */
const phoneValue = (v = '') => {
  const d = v.replace(/\D/g, '').replace(/^998/, '');
  return d ? `${PHONE_PREFIX}${d}` : '';
};

const CHARSETS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];

/** 16 chars from crypto.getRandomValues — at least one upper, lower, digit and symbol; look-alikes (0/O, 1/l/I) left out. */
const generatePassword = (length = 16) => {
  const all = CHARSETS.join('');
  const rand = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = [...CHARSETS.map((set) => set[rand(set.length)]), ...Array.from({ length: length - CHARSETS.length }, () => all[rand(all.length)])];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

/** Until the backend returns the name parts, split `full_name` ("First Last Middle"). */
const nameParts = (u: User) => {
  if (u.first_name || u.last_name) return { first_name: u.first_name ?? '', last_name: u.last_name ?? '', middle_name: u.middle_name ?? '' };
  const [first_name = '', last_name = '', ...rest] = u.full_name.trim().split(/\s+/);
  return { first_name, last_name, middle_name: rest.join(' ') };
};

export const UserDrawer = ({ open, user, onClose }: { open: boolean; user?: User; onClose: () => void }) => {
  const [form] = Form.useForm<UserFormValues>();
  const { message } = App.useApp();
  const me = useCurrentUser();
  const save = useSaveUser();
  const [showPassword, setShowPassword] = useState(false);

  const onGenerate = () => {
    const password = generatePassword();
    form.setFieldValue('password', password);
    void form.validateFields(['password']);
    setShowPassword(true);
    navigator.clipboard?.writeText(password).then(() => message.success('Password generated and copied'), () => message.success('Password generated'));
  };

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      user
        ? {
          ...nameParts(user),
          username: user.username,
          email: user.email,
          position: user.position,
          phone: maskPhone(user.phone ?? ''),
          roles: user.roles,
        }
        : { roles: ['EMPLOYEE'], phone: maskPhone() },
    );
  }, [open, user, form]);

  const roleOptions = ROLE_OPTIONS.filter((r) => me.roles.includes('SUPER_ADMIN') || r.value !== 'SUPER_ADMIN');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={user ? `Edit ${user.full_name || user.username}` : 'New user'}
      destroyOnHidden
      afterOpenChange={(o) => !o && setShowPassword(false)}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
            {user ? 'Save' : 'Create user'}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) =>
          save.mutate(
            {
              user,
              values: { ...values, middle_name: values.middle_name?.trim() ?? '', phone: phoneValue(values.phone) },
            },
            {
              onSuccess: () => {
                message.success(user ? 'User updated' : 'User created');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="first_name" label="First name" rules={[rules.required('First name')]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Last name" rules={[rules.required('Last name')]}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="middle_name" label="Middle name">
          <Input />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="username"
            label="Username"
            normalize={(v: string) => v?.toLowerCase().replace(/\s/g, '')}
            rules={[
              rules.required('Username'),
              { pattern: /^[a-z0-9_.@+-]{3,150}$/, message: 'a-z, 0-9, _ . @ + - (min 3)' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[rules.required('Email'), rules.email]}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ validator: (r, v: string | undefined) => (phoneValue(v) ? (rules.phone.validator(r, phoneValue(v))) : Promise.resolve()) }]}
          normalize={(v: string) => maskPhone(v)}
        >
          <Input placeholder="+998 99 999 99 99" inputMode="tel" />
        </Form.Item>
        <Form.Item name="position" label="Position">
          <Input />
        </Form.Item>
        <Form.Item
          name="roles"
          label="Roles"
          rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one role' }]}
        >
          <Select
            mode="multiple"
            options={roleOptions}
            disabled={user?.roles.includes('SUPER_ADMIN') && !me.roles.includes('SUPER_ADMIN')}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={user ? 'New password' : 'Password'}
          extra={user ? 'Leave empty to keep the current password.' : undefined}
          rules={user ? [rules.min(8)] : [rules.required('Password'), rules.min(8)]}
        >
          <Input.Password
            autoComplete="new-password"
            visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
            addonAfter={
              <Button type="text" size="small" className="!h-auto !px-1" onClick={onGenerate}
                icon={<HugeiconsIcon icon={MagicWand01Icon} size={14} className="hicon" strokeWidth={1.7} />}>
                Generate
              </Button>
            }
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
