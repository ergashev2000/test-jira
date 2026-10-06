import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Home01Icon, KanbanIcon, ListViewIcon, Rocket01Icon } from '@hugeicons/core-free-icons';
import { Popover, Tooltip } from 'antd';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useProjectLookups } from '@/shared/api/lookups';
import { hasPermission, ROUTES } from '@/shared/constants';
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

const PROJECT_TABS = [
  { tab: 'overview', label: 'Overview', icon: Home01Icon },
  { tab: 'board', label: 'Board', icon: KanbanIcon },
  { tab: 'backlog', label: 'Backlog', icon: ListViewIcon },
  { tab: 'sprints', label: 'Sprints', icon: Rocket01Icon },
] as const;

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

/** Collapsed rail: project icon whose sections open in a popover on hover. */
const CollapsedProject = ({
  project,
  active,
}: {
  project: { id: number; key: string; name: string };
  active: boolean;
}) => (
  <Popover
    placement="rightTop"
    arrow={false}
    mouseEnterDelay={0.05}
    styles={{ body: { padding: 6 } }}
    content={
      <div className="flex w-48 flex-col gap-0.5">
        <div className="flex items-center gap-2 px-2 pt-1 pb-1.5 text-xs font-medium text-fg">
          <ProjectIcon projectKey={project.key} size={14} />
          <span className="truncate">{project.name}</span>
        </div>
        {PROJECT_TABS.map(({ tab, label, icon }) => (
          <Item key={tab} collapsed={false} item={{ to: ROUTES.project(project.id, tab), label, icon }} />
        ))}
      </div>
    }
  >
    <NavLink
      to={ROUTES.project(project.id)}
      aria-label={project.name}
      className={cn(
        'flex h-8 items-center justify-center rounded-md transition-colors hover:bg-surface-2',
        active && 'bg-surface-3',
      )}
    >
      <ProjectIcon projectKey={project.key} size={16} />
    </NavLink>
  </Popover>
);

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

const ProjectsNav = ({ collapsed }: { collapsed: boolean }) => {
  const { data: projects = [] } = useProjectLookups();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState<string | null>(pathname.split('/')[2] ?? null);
  const list = projects.filter((p) => p.status !== 'archived');
  if (!list.length) return null;
  if (collapsed) {
    return (
      <Section title="Your projects" collapsed>
        {list.map((p) => (
          <CollapsedProject
            key={p.id}
            project={p}
            active={pathname.startsWith(`${ROUTES.PROJECTS}/${p.id}/`)}
          />
        ))}
      </Section>
    );
  }
  return (
    <Section title="Your projects" collapsed={collapsed}>
      {list.map((p) => (
        <div key={p.id}>
          <button
            type="button"
            onClick={() => setExpanded(expanded === String(p.id) ? null : String(p.id))}
            className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2 text-left text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg"
          >
            <ProjectIcon projectKey={p.key} size={15} />
            <span className="flex-1 truncate">{p.name}</span>
            <Chevron open={expanded === String(p.id)} className="text-fg-3" />
          </button>
          <Collapsible open={expanded === String(p.id)}>
            <div className="ml-4 flex flex-col gap-0.5 border-l border-line py-0.5 pl-2">
              {PROJECT_TABS.map(({ tab, label, icon }) => (
                <Item key={tab} collapsed={false} item={{ to: ROUTES.project(p.id, tab), label, icon }} />
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
      <ProjectsNav collapsed={collapsed} />
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
