import { App, Button, Form, Input, Result } from 'antd';
import { Icon } from '@/shared/components/ui/Icon';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/shared/constants';
import { errorMessage, rules } from '@/shared/utils';

import { forgotPassword, resetPassword } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';

export const ForgotPasswordPage = () => {
  const mutation = useMutation({ mutationFn: forgotPassword });

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Check your email">
        <Result
          status="success"
          className="!p-0"
          subTitle={`If an account exists for ${mutation.variables}, we sent a password reset link.`}
          extra={<Link to={ROUTES.LOGIN}>Back to login</Link>}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <Form layout="vertical" requiredMark={false} onFinish={(v: { email: string }) => mutation.mutate(v.email)}>
        <Form.Item name="email" label="Email" rules={[rules.required('Email'), rules.email]}>
          <Input size="large" prefix={<Icon name="mail" className="text-fg-3" />} placeholder="you@company.uz" autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
          Send reset link
        </Button>
        <div className="mt-4 text-center">
          <Link to={ROUTES.LOGIN}>Back to login</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export const ResetPasswordPage = () => {
  const [sp] = useSearchParams();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (password: string) => resetPassword(sp.get('token') ?? '', password),
    onSuccess: () => {
      message.success('Password updated. You can log in now.');
      navigate(ROUTES.LOGIN);
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  return (
    <AuthLayout title="Set a new password">
      <Form layout="vertical" requiredMark={false} onFinish={(v: { password: string }) => mutation.mutate(v.password)}>
        <Form.Item name="password" label="New password" rules={[rules.required('Password'), rules.min(6)]}>
          <Input.Password size="large" autoFocus />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm password"
          dependencies={['password']}
          rules={[
            rules.required('Confirmation'),
            ({ getFieldValue }) => ({
              validator: (_, v) =>
                !v || v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match')),
            }),
          ]}
        >
          <Input.Password size="large" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
          Update password
        </Button>
      </Form>
    </AuthLayout>
  );
};
