import { HugeiconsIcon } from '@hugeicons/react';
import { LockPasswordIcon, UserIcon } from '@hugeicons/core-free-icons';
import { App, Button, Form, Input, Switch } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/shared/constants';
import { MOCK_ENABLED, useDemoMode } from '@/shared/lib/demoMode';
import { MOCK_PASSWORD } from '@/shared/lib/mockServer/db';
import { isSignedIn } from '@/shared/lib/session';
import { errorMessage, rules } from '@/shared/utils';

import { login, type LoginPayload } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const [form] = Form.useForm<LoginPayload>();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const signedIn = useAuthStore(isSignedIn);
  const demo = useDemoMode((s) => s.enabled);
  const setDemo = useDemoMode((s) => s.setEnabled);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ access, refresh, user }) => {
      setSession(access, refresh, user);
      message.success(`Welcome back, ${user.full_name.split(' ')[0]}`);
      navigate(sp.get('redirect') || ROUTES.HOME, { replace: true });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  if (signedIn) return <Navigate to={sp.get('redirect') || ROUTES.HOME} replace />;

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to U-management to manage your projects and tasks">
      <Form form={form} requiredMark={false} onFinish={(v) => mutation.mutate(v)}>
        <Form.Item name="username" rules={[rules.required('Username')]} className="mb-5!">
          <Input
            size="large"
            prefix={<HugeiconsIcon icon={UserIcon} size={18} className="hicon mr-1 text-fg-3" strokeWidth={1.7} />}
            placeholder="Username"
            autoFocus
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item name="password" rules={[rules.required('Password')]} className="mb-3!">
          <Input.Password
            size="large"
            prefix={<HugeiconsIcon icon={LockPasswordIcon} size={18} className="hicon mr-1 text-fg-3" strokeWidth={1.7} />}
            placeholder="Password"
            autoComplete="current-password"
          />
        </Form.Item>
        <div className="mb-8 flex justify-end">
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
        {MOCK_ENABLED && <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 text-[13px] text-fg-2">
          <Switch size="small" className="mt-0.5" checked={demo} onChange={setDemo} />
          <span>
            <span className="text-fg">Demo data</span> — work on mock data, no backend needed
            {demo && (
              <span className="mt-1 block text-xs text-fg-3">
                Users: <code>superadmin</code>, <code>admin</code>, <code>bekzod</code> (PM), <code>akmal</code> (Team Lead), <code>shohrux</code> (Employee) · password <code>{MOCK_PASSWORD}</code>
              </span>
            )}
          </span>
        </label>}
      </Form>
    </AuthLayout>
  );
};
