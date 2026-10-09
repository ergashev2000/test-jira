import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Tooltip } from 'antd';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { hasPermission, ROUTES } from '@/shared/constants';
import { useRecentProjectsStore } from '@/shared/lib/recentProjects';
import { useSessionStore } from '@/shared/lib/session';
import { cn } from '@/shared/utils';

import { ProjectIcon } from '@/shared/components/ui/ProjectIcon';

import { ADMIN, WORK, WORKSPACE, type NavItem } from '../navigation';

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
  <motion.span
    className={cn('inline-flex', className)}
    initial={false}
    animate={{ rotate: open ? 0 : -90 }}
    transition={EASE}
  >
    <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="hicon" strokeWidth={1.7} />
  </motion.span>
);

/** In the collapsed rail an item shows only its icon; the label appears in a tooltip on hover. */
const Item = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.NOTIFICATIONS}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] !text-fg-2 transition-colors hover:bg-surface-2 hover:!text-fg',
          isActive && 'bg-surface-3 !text-fg',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <HugeiconsIcon icon={item.icon} size={16} className="hicon" strokeWidth={1.7} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip title={item.label} placement="right" mouseEnterDelay={0.05}>
      {link}
    </Tooltip>
  ) : (
    link
  );
};

/** A project in the sidebar — links straight to the project page; collapsed it shows only the icon. */
const ProjectLink = ({
  project,
  collapsed,
}: {
  project: { id: number; key: string; name: string };
  collapsed: boolean;
}) => {
  const link = (
    <NavLink
      to={ROUTES.project(project.id)}
      aria-label={collapsed ? project.name : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] !text-fg-2 transition-colors hover:bg-surface-2 hover:!text-fg',
          isActive && 'bg-surface-3 !text-fg',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <ProjectIcon projectKey={project.key} size={collapsed ? 16 : 15} />
      {!collapsed && <span className="truncate">{project.name}</span>}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip title={project.name} placement="right" mouseEnterDelay={0.05}>
      {link}
    </Tooltip>
  ) : (
    link
  );
};

const Section = ({
  title,
  children,
  collapsed,
}: {
  title: string;
  children: ReactNode;
  collapsed: boolean;
}) => {
  const [open, setOpen] = useState(true);
  if (collapsed) return <div className="flex flex-col gap-0.5 border-t border-line pt-2">{children}</div>;
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-7 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 text-xs text-fg-3 hover:text-fg-2"
      >
        {title}
        <Chevron open={open} />
      </button>
      <Collapsible open={open}>
        <div className="flex flex-col gap-0.5 pt-0.5">{children}</div>
      </Collapsible>
    </div>
  );
};

/** Last opened projects (this browser, per user) — only ones the user can still see. */
const RecentNav = ({ collapsed }: { collapsed: boolean }) => {
  const userId = useSessionStore((s) => s.user?.id);
  const ids = useRecentProjectsStore((s) => (userId ? s.byUser[userId] : undefined));
  const { data: projects = [] } = useProjectLookups();
  const list = (ids ?? []).map((id) => projects.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && p.status !== 'archived');
  if (!list.length) return null;
  return (
    <Section title="Recent" collapsed={collapsed}>
      {list.map((p) => (
        <ProjectLink key={p.id} project={p} collapsed={collapsed} />
      ))}
    </Section>
  );
};

/** Role-filtered navigation — items without permission are not rendered at all. */
export const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const user = useSessionStore((s) => s.user);
  const visible = (items: NavItem[]) =>
    items.filter((i) => !i.permission || hasPermission(user, i.permission));
  const admin = visible(ADMIN);
  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto px-2 py-3">
      <div className="flex flex-col gap-0.5">
        {visible(WORK).map((i) => (
          <Item key={i.to} item={i} collapsed={collapsed} />
        ))}
      </div>
      <Section title="Workspace" collapsed={collapsed}>
        {visible(WORKSPACE).map((i) => (
          <Item key={i.to} item={i} collapsed={collapsed} />
        ))}
      </Section>
      <RecentNav collapsed={collapsed} />
      {admin.length > 0 && (
        <Section title="Administration" collapsed={collapsed}>
          {admin.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </Section>
      )}
    </nav>
  );
};
