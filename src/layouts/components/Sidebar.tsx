import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { hasPermission, ROUTES, type Permission } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import { cn } from '@/shared/utils';

import { Icon, type IconName } from '@/shared/components/ui/Icon';
import { ProjectIcon } from '@/shared/components/ui/ProjectIcon';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  permission?: Permission;
  /** Custom visibility check (in addition to permission). */
  show?: (role: string) => boolean;
}

const WORK: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: 'dashboard', permission: 'dashboard.view' },
  { to: ROUTES.MY_TASKS, label: 'My tasks', icon: 'task' },
  { to: ROUTES.NOTIFICATIONS, label: 'Inbox', icon: 'notification' },
];

const WORKSPACE: NavItem[] = [
  { to: ROUTES.PROJECTS, label: 'Projects', icon: 'projects', permission: 'project.view' },
  { to: ROUTES.SPRINTS, label: 'Sprints', icon: 'sprint', permission: 'sprint.view' },
  { to: ROUTES.BOARD, label: 'Board', icon: 'board', permission: 'board.view' },
  { to: ROUTES.REPORTS, label: 'Reports', icon: 'analytics', permission: 'report.view' },
];

const ADMIN: NavItem[] = [
  { to: ROUTES.USERS, label: 'Users', icon: 'users', permission: 'user.manage' },
  { to: ROUTES.TEAMS, label: 'Teams', icon: 'team', permission: 'team.manage' },
  { to: ROUTES.AUDIT_LOG, label: 'Audit log', icon: 'shield', permission: 'auditLog.view' },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: 'settings', permission: 'settings.manage' },
];

const EASE: Transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

/** Height-animated accordion body; `initial={false}` skips the animation on first render. */
const Collapsible = ({ open, children }: { open: boolean; children: ReactNode }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={EASE}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const Chevron = ({ open, className }: { open: boolean; className?: string }) => (
  <motion.span className={cn('inline-flex', className)} initial={false} animate={{ rotate: open ? 0 : -90 }} transition={EASE}>
    <Icon name="arrowDown" size={12} />
  </motion.span>
);

const Item = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => (
  <NavLink
    to={item.to}
    end={item.to === ROUTES.NOTIFICATIONS}
    title={collapsed ? item.label : undefined}
    className={({ isActive }) => cn(
      'flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] !text-fg-2 transition-colors hover:bg-surface-2 hover:!text-fg',
      isActive && 'bg-surface-3 !text-fg',
      collapsed && 'justify-center px-0',
    )}
  >
    <Icon name={item.icon} size={16} />
    {!collapsed && <span className="truncate">{item.label}</span>}
  </NavLink>
);

const Section = ({ title, children, collapsed }: { title: string; children: ReactNode; collapsed: boolean }) => {
  const [open, setOpen] = useState(true);
  if (collapsed) return <div className="flex flex-col gap-0.5 border-t border-line pt-2">{children}</div>;
  return (
    <div className="flex flex-col">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex h-7 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 text-xs text-fg-3 hover:text-fg-2">
        {title}
        <Chevron open={open} />
      </button>
      <Collapsible open={open}>
        <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>
      </Collapsible>
    </div>
  );
};

const ProjectsNav = ({ collapsed }: { collapsed: boolean }) => {
  const { data: projects = [] } = useProjectLookups();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<string | null>(pathname.split('/')[2] ?? null);
  const list = projects.filter((p) => p.status !== 'ARCHIVED');
  if (!list.length || collapsed) return null;
  return (
    <Section title="Your projects" collapsed={collapsed}>
      {list.map((p) => (
        <div key={p.id}>
          <button type="button" onClick={() => setExpanded(expanded === p.key ? null : p.key)}
            className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2 text-left text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg">
            <ProjectIcon projectKey={p.key} size={15} />
            <span className="flex-1 truncate">{p.name}</span>
            <Chevron open={expanded === p.key} className="text-fg-3" />
          </button>
          <Collapsible open={expanded === p.key}>
            <div className="ml-4 flex flex-col gap-0.5 border-l border-line py-0.5 pl-2">
              {(['overview', 'board', 'backlog', 'sprints'] as const).map((tab) => (
                <Item key={tab} collapsed={false}
                  item={{ to: ROUTES.project(p.key, tab), label: tab[0].toUpperCase() + tab.slice(1),
                    icon: tab === 'overview' ? 'home' : tab === 'board' ? 'board' : tab === 'backlog' ? 'list' : 'sprint' }} />
              ))}
            </div>
          </Collapsible>
        </div>
      ))}
    </Section>
  );
};

/** Role-filtered navigation — items without permission are not rendered at all. */
export const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const role = useSessionStore((s) => s.user?.role);
  const visible = (items: NavItem[]) => items.filter((i) => !i.permission || hasPermission(role, i.permission));
  const admin = visible(ADMIN);
  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto px-2 py-3">
      <div className="flex flex-col gap-0.5">{visible(WORK).map((i) => <Item key={i.to} item={i} collapsed={collapsed} />)}</div>
      <Section title="Workspace" collapsed={collapsed}>
        {visible(WORKSPACE).map((i) => <Item key={i.to} item={i} collapsed={collapsed} />)}
      </Section>
      <ProjectsNav collapsed={collapsed} />
      {admin.length > 0 && (
        <Section title="Administration" collapsed={collapsed}>
          {admin.map((i) => <Item key={i.to} item={i} collapsed={collapsed} />)}
        </Section>
      )}
    </nav>
  );
};
