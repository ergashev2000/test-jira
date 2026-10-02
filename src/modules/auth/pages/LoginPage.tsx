import { HugeiconsIcon } from '@hugeicons/react';
import { LockPasswordIcon, UserIcon } from '@hugeicons/core-free-icons';
import { App, Button, Form, Input } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/shared/constants';
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

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token: t, refresh, user }) => {
      setSession(t, refresh, user);
      message.success(`Welcome back, ${user.fullName.split(' ')[0]}`);
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
      </Form>
    </AuthLayout>
  );
};
