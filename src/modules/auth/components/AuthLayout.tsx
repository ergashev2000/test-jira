import { ConfigProvider, theme, type ThemeConfig } from 'antd';
import type { ReactNode } from 'react';

import { Icon } from '@/shared/components/ui/Icon';
import { useThemeStore, type ThemeMode } from '@/shared/lib/theme';

const AUTH_PRIMARY = '#165dff';

/** Standalone antd theme for auth screens; `inherit: false` keeps the app's dark tokens out of light mode. */
const authTheme = (mode: ThemeMode): ThemeConfig => ({
  inherit: false,
  algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: AUTH_PRIMARY,
    colorInfo: AUTH_PRIMARY,
    colorLink: mode === 'dark' ? '#5b8cff' : AUTH_PRIMARY,
    colorBgContainer: mode === 'dark' ? '#0e1628' : '#ffffff',
    colorBorder: mode === 'dark' ? '#1f2a40' : '#e3e9f3',
    fontFamily: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    borderRadius: 8,
    controlHeightLG: 48,
  },
  components: {
    Button: { primaryShadow: 'none', fontWeight: 500 },
  },
});

export const AuthLayout = ({
  title,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => {
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggle);

  return (
    <ConfigProvider theme={authTheme(mode)}>
      <div className="auth-shell relative flex min-h-full overflow-hidden" data-theme={mode}>
        <button
          type="button"
          onClick={toggleMode}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="absolute top-5 right-5 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-fg-2 transition-colors hover:text-fg"
        >
          <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>

        <div className="auth-hero pointer-events-none relative hidden flex-2 lg:block">
          <img
            src="/login-image.webp"
            alt=""
            className="absolute inset-0 size-full object-cover object-left"
          />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 py-12 lg:justify-start lg:pr-16 lg:pl-4">
          <div className="w-full max-w-[420px]">
            <img src="/logo.svg" alt="" />
            <h1 className="mt-6 mb-0 text-[32px] leading-tight font-semibold tracking-tight text-fg">
              {title}
            </h1>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};
