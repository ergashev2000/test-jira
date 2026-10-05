import { HugeiconsIcon } from '@hugeicons/react';
import { Logout03Icon, Moon02Icon, Notification03Icon, SidebarLeftIcon, Sun03Icon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { Button, Dropdown, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

import { logout } from '@/modules/auth';
import { NotificationBell } from '@/modules/notifications';
import { useAppSettings } from '@/modules/settings';
import { useCurrentUser } from '@/shared/hooks';
import { primaryRole, ROLES, ROUTES } from '@/shared/constants';

import { UserAvatar } from '@/shared/components/ui/UserAvatar';
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
  const { data: settings } = useAppSettings();
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 px-3">
      <div className={cn('flex items-center gap-2 transition-all', collapsed ? 'w-10' : 'w-[216px]')}>
        <img src="/logo.svg" alt="logo image" className='size-6'/>
        {!collapsed && <span className="truncate text-[13px] font-semibold">{settings?.general.company_name ?? 'U-management'}</span>}
      </div>
      <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <Button type="text" size="small" icon={<HugeiconsIcon icon={SidebarLeftIcon} size={16} className="hicon" strokeWidth={1.7} />} onClick={onToggleSidebar} />
      </Tooltip>
      <div className="flex flex-1 justify-center"><GlobalSearch /></div>
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
