import { Button, Dropdown, Grid, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { logout } from '@/modules/auth';
import { useAppSettings } from '@/modules/settings';
import { NotificationBell } from '@/modules/notifications';
import { TaskDrawer } from '@/modules/tasks';
import { ROLES, ROUTES } from '@/shared/constants';
import { Icon } from '@/shared/components/ui/Icon';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { useSessionStore } from '@/shared/lib/session';
import { useThemeStore } from '@/shared/lib/theme';
import { cn } from '@/shared/utils';

import { GlobalSearch } from '@/shared/components/layout/GlobalSearch';
import { Sidebar } from '@/shared/components/layout/Sidebar';

/** App shell: top bar (workspace · search · inbox · user), sidebar, inset content panel. */
export const MainLayout = () => {
  const user = useSessionStore((s) => s.user)!;
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const { data: settings } = useAppSettings();
  const [collapsed, setCollapsed] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  useEffect(() => {
    if (screens.xl === false) setCollapsed(true);
    if (screens.xl) setCollapsed(false);
  }, [screens.xl]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-12 shrink-0 items-center gap-3 px-3">
        <div className={cn('flex items-center gap-2 transition-all', collapsed ? 'w-10' : 'w-[216px]')}>
          <img src="/logo.svg" alt="logo image" className='size-6'/>
          {!collapsed && <span className="truncate text-[13px] font-semibold">{settings?.general.companyName ?? 'Workspace'}</span>}
        </div>
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Button type="text" size="small" icon={<Icon name="sidebar" size={16} />} onClick={() => setCollapsed(!collapsed)} />
        </Tooltip>
        <div className="flex flex-1 justify-center"><GlobalSearch /></div>
        <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <Button
            type="text"
            size="small"
            aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            icon={<Icon name={themeMode === 'dark' ? 'sun' : 'moon'} size={16} />}
            onClick={toggleTheme}
          />
        </Tooltip>
        <NotificationBell />
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'who', type: 'group', label: <div className="py-1"><div className="text-fg">{user.fullName}</div><div className="text-xs text-fg-3">{ROLES[user.role].label}</div></div> },
              { type: 'divider' },
              { key: 'profile', label: 'Profile', icon: <Icon name="userCircle" size={14} /> },
              { key: 'notif', label: 'Notification settings', icon: <Icon name="notification" size={14} /> },
              { key: 'theme', label: themeMode === 'dark' ? 'Light mode' : 'Dark mode', icon: <Icon name={themeMode === 'dark' ? 'sun' : 'moon'} size={14} /> },
              { type: 'divider' },
              { key: 'logout', label: 'Log out', icon: <Icon name="logout" size={14} />, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'profile') navigate(ROUTES.PROFILE);
              if (key === 'notif') navigate(ROUTES.NOTIFICATION_SETTINGS);
              if (key === 'theme') toggleTheme();
              if (key === 'logout') { logout(); navigate(ROUTES.LOGIN, { replace: true }); }
            },
          }}
        >
          <button type="button" className="flex cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-1.5 py-1 hover:bg-surface-2">
            <UserAvatar userId={user.id} size={24} noTooltip />
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-xs text-fg">{user.fullName}</span>
              <span className="block text-[11px] text-fg-3">{ROLES[user.role].label}</span>
            </span>
          </button>
        </Dropdown>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={cn('shrink-0 transition-all', collapsed ? 'w-14' : 'w-[240px]')}>
          <Sidebar collapsed={collapsed} />
        </aside>
        <main className="mr-2 mb-2 min-w-0 flex-1 overflow-auto rounded-lg border border-line bg-panel">
          <Outlet />
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
};