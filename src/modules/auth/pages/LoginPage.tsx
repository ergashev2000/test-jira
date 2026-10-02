import { App, Button, Checkbox, Form, Input } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROLES, ROUTES } from '@/shared/constants';
import type { Role } from '@/shared/types';
import { errorMessage, rules } from '@/shared/utils';

import { login, type LoginPayload } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/authStore';

const DEMO: { username: string; role: Role; inactive?: boolean }[] = [
  { username: 'superadmin', role: 'SUPER_ADMIN' },
  { username: 'admin', role: 'ADMIN' },
  { username: 'bekzod', role: 'PROJECT_MANAGER' },
  { username: 'akmal', role: 'TEAM_LEAD' },
  { username: 'shohrux', role: 'EMPLOYEE' },
  { username: 'otabek', role: 'EMPLOYEE', inactive: true },
];

export const LoginPage = () => {
  const [form] = Form.useForm<LoginPayload>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { token, setSession } = useAuthStore();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token: t, user }, vars) => {
      setSession(t, user, vars.remember);
      message.success(`Welcome back, ${user.fullName.split(' ')[0]}`);
      navigate(sp.get('redirect') || ROUTES.HOME, { replace: true });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  if (token) return <Navigate to={sp.get('redirect') || ROUTES.HOME} replace />;

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to U-management to manage your projects and tasks">
      <Form
        form={form}
        requiredMark={false}
        onFinish={(v) => mutation.mutate(v)}
        initialValues={{ remember: true }}
      >
        <Form.Item name="username" rules={[rules.required('Username')]} className="!mb-5">
          <Input size="large" placeholder="Username or email" autoFocus autoComplete="username" />
        </Form.Item>
        <Form.Item name="password" rules={[rules.required('Password')]} className="!mb-3">
          <Input.Password size="large" placeholder="Password" autoComplete="current-password" />
        </Form.Item>
        <div className="mb-8 flex items-center justify-between">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Link to={ROUTES.FORGOT_PASSWORD} className="!text-fg-3 hover:!text-fg-2">
            Forgot password?
          </Link>
        </div>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={mutation.isPending}
          className="!h-12 !text-base"
        >
          Log in
        </Button>
      </Form>

      <div className="mt-8 border-t border-line pt-5">
        <div className="mb-2 text-xs text-fg-3">Demo accounts · password 123456</div>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.username}
              type="button"
              onClick={() => form.setFieldsValue({ username: d.username, password: '123456' })}
              className="flex cursor-pointer flex-col items-start rounded-md border border-line bg-surface px-2.5 py-1.5 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <span className="text-xs font-medium text-fg">{d.username}</span>
              <span className="text-[11px] text-fg-3">
                {ROLES[d.role].label}
                {d.inactive && <span className="text-danger"> · inactive</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};
