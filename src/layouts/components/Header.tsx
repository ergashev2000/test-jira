import { HugeiconsIcon } from '@hugeicons/react';
import { DatabaseIcon, Logout03Icon, Moon02Icon, Notification03Icon, SidebarLeftIcon, Sun03Icon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { App, Badge, Button, Dropdown, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

import { logout } from '@/modules/auth';
import { NotificationBell } from '@/modules/notifications';
import { TelegramHeaderButton } from '@/modules/profile';
import { useCurrentUser } from '@/shared/hooks';
import { primaryRole, ROLES, ROUTES } from '@/shared/constants';

import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { MOCK_ENABLED, useDemoMode } from '@/shared/lib/demoMode';
import { queryClient } from '@/shared/lib/react-query';
import { useSessionStore } from '@/shared/lib/session';
import { useThemeStore } from '@/shared/lib/theme';
import { cn } from '@/shared/utils';

import { GlobalSearch } from './GlobalSearch';

interface Props {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

/** Top bar: workspace · sidebar toggle · search · theme · inbox · user menu. */
export const Header = ({ collapsed, onToggleSidebar }: Props) => {
  const user = useCurrentUser();
  const role = primaryRole(user.roles);
  const navigate = useNavigate();
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const { message } = App.useApp();
  const demo = useDemoMode((s) => s.enabled);
  const fallback = useDemoMode((s) => s.fallback);
  const toggleDemo = useDemoMode((s) => s.toggle);

  /** Switches every request between the mock server and the real backend, then reloads all data. */
  const onToggleDemo = () => {
    toggleDemo();
    // A mock session's token means nothing to the real backend — sign in again there.
    if (demo && useSessionStore.getState().token?.startsWith('mock.')) {
      logout();
      navigate(ROUTES.LOGIN, { replace: true });
      message.info('Demo data off — log in with your backend account');
      return;
    }
    void queryClient.resetQueries();
    message.info(demo ? 'Demo data off — using the backend' : 'Demo data on — all pages use mock data');
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-3">
      <div className={cn('flex items-center gap-2 transition-all', collapsed ? 'w-10' : 'w-[216px]')}>
        <img src="/logo.svg" alt="logo image" className='size-6' />
        {!collapsed && <span className="truncate text-base font-semibold">U-management</span>}
      </div>
      <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <Button type="text" size="small" icon={<HugeiconsIcon icon={SidebarLeftIcon} size={16} className="hicon" strokeWidth={1.7} />} onClick={onToggleSidebar} />
      </Tooltip>

      <div className="flex flex-1 justify-center"><GlobalSearch /></div>
      <TelegramHeaderButton />
      {MOCK_ENABLED && <Tooltip title={demo
        ? 'Demo data: ON — every page uses mock data, no API requests'
        : fallback
          ? 'Demo data: OFF — some data is mock (backend unreachable or endpoint missing). Click to use mock everywhere'
          : 'Demo data: OFF — click to use mock data everywhere'}>
        <Badge dot={!demo && fallback} color="var(--c-warn)" offset={[-6, 6]}>
          <Button
            type="text"
            className={cn('header-action', demo && '!bg-warn/15 !text-warn')}
            aria-label={demo ? 'Turn demo data off' : 'Turn demo data on'}
            aria-pressed={demo}
            icon={<HugeiconsIcon icon={DatabaseIcon} size={16} className="hicon" strokeWidth={1.7} />}
            onClick={onToggleDemo}
          />
        </Badge>
      </Tooltip>}
      <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
        <Button
          type="text"
          className="header-action"
          aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          icon={<HugeiconsIcon icon={themeMode === 'dark' ? Sun03Icon : Moon02Icon} size={16} className="hicon" strokeWidth={1.7} />}
          onClick={toggleTheme}
        />
      </Tooltip>
      <NotificationBell />
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: 'who', type: 'group', label: <div className="py-1"><div className="text-fg">{user.full_name}</div><div className="text-xs text-fg-3">{ROLES[role].label}</div></div> },
            { type: 'divider' },
            { key: 'profile', label: 'Profile', icon: <HugeiconsIcon icon={UserCircleIcon} size={14} className="hicon" strokeWidth={1.7} /> },
            { key: 'notif', label: 'Notification settings', icon: <HugeiconsIcon icon={Notification03Icon} size={14} className="hicon" strokeWidth={1.7} /> },
            { type: 'divider' },
            { key: 'logout', label: 'Log out', icon: <HugeiconsIcon icon={Logout03Icon} size={14} className="hicon" strokeWidth={1.7} />, danger: true },
          ],
          onClick: ({ key }) => {
            if (key === 'profile') navigate(ROUTES.PROFILE);
            if (key === 'notif') navigate(ROUTES.NOTIFICATION_SETTINGS);
            if (key === 'logout') { logout(); navigate(ROUTES.LOGIN, { replace: true }); }
          },
        }}
      >
        <button type="button" className="header-action gap-2 px-1.5 md:pr-3">
          <UserAvatar user={user} size={24} noTooltip />
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-xs text-fg">{user.full_name}</span>
            <span className="block text-[11px] text-fg-3">{ROLES[role].label}</span>
          </span>
        </button>
      </Dropdown>
    </header>
  );
};
