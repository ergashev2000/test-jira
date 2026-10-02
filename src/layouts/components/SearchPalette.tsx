import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Modal } from 'antd';
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { globalSearch } from '@/modules/tasks';
import { hasPermission, PROJECT_STATUS, QUERY_KEYS, ROUTES, SPRINT_STATUS } from '@/shared/constants';
import { useDebounce } from '@/shared/hooks';
import { useSessionStore } from '@/shared/lib/session';
import { useThemeStore } from '@/shared/lib/theme';
import { cn, TASK_KEY_RE } from '@/shared/utils';

import { Icon, type IconName } from '@/shared/components/ui/Icon';
import { PriorityIcon, StatusIcon } from '@/shared/components/ui/icons';
import { Spinner } from '@/shared/components/ui/Loader';
import { ProjectIcon } from '@/shared/components/ui/ProjectIcon';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';

import { ACCOUNT, ADMIN, WORK, WORKSPACE } from '../navigation';

interface PaletteItem {
  id: string;
  group: string;
  icon: ReactNode;
  title: string;
  /** Monospace prefix before the title (task key). */
  code?: string;
  /** Muted text after the title. */
  meta?: string;
  /** Second line (match explanation, comment excerpt…). */
  hint?: string;
  trailing?: ReactNode;
  run: () => void;
}

const MATCH_LABEL = { description: 'Description', label: 'Label', assignee: 'Assignee', project: 'Project', status: 'Status', priority: 'Priority' } as const;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps every query token occurrence in a <mark>. */
const Highlight = ({ text, tokens }: { text: string; tokens: string[] }) => {
  if (!tokens.length) return <>{text}</>;
  const re = new RegExp(`(${tokens.map(escapeRe).join('|')})`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 ? <mark key={i} className="rounded-sm bg-primary/20 px-px text-fg">{part}</mark> : part,
      )}
    </>
  );
};

const NavIcon = ({ name }: { name: IconName }) => (
  <span className="flex size-7 items-center justify-center rounded-md border border-line bg-surface-2 text-fg-2">
    <Icon name={name} size={14} />
  </span>
);

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-sans text-[10px] text-fg-2">{children}</kbd>
);

/** Command palette: searches everything in the workspace, keyboard driven. */
export const SearchPalette = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const role = useSessionStore((s) => s.user?.role);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const themeMode = useThemeStore((s) => s.mode);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [active, setActive] = useState(0);

  const q = useDebounce(value.trim(), 150);
  const tokens = useMemo(() => q.toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.tasks.search(q),
    queryFn: () => globalSearch(q),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const close = () => {
    onClose();
    setValue('');
    setActive(0);
  };
  const go = (to: string) => () => { close(); navigate(to); };

  const items = useMemo<PaletteItem[]>(() => {
    const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(role, p);
    const matches = (text: string) => tokens.every((t) => text.toLowerCase().includes(t));
    const list: PaletteItem[] = [];

    for (const t of data?.tasks ?? []) {
      list.push({
        id: `task:${t.id}`, group: q ? 'Tasks' : 'Recent tasks',
        icon: <span className="flex size-7 items-center justify-center"><StatusIcon status={t.status} size={14} /></span>,
        code: t.key, title: t.title,
        hint: t.match ? `${MATCH_LABEL[t.match.field]}: ${t.match.snippet}` : undefined,
        trailing: <span className="flex items-center gap-2"><PriorityIcon priority={t.priority} size={13} />{t.assigneeId && <UserAvatar userId={t.assigneeId} size={18} noTooltip />}</span>,
        run: go(ROUTES.task(t.key)),
      });
    }
    for (const p of data?.projects ?? []) {
      list.push({
        id: `project:${p.id}`, group: 'Projects',
        icon: <span className="flex size-7 items-center justify-center"><ProjectIcon projectKey={p.key} size={16} /></span>,
        title: p.name, meta: `${p.key} · ${PROJECT_STATUS[p.status].label}`, hint: p.description || undefined,
        run: go(ROUTES.project(p.key)),
      });
    }
    for (const s of data?.sprints ?? []) {
      list.push({
        id: `sprint:${s.id}`, group: 'Sprints', icon: <NavIcon name="sprint" />,
        title: s.name, meta: `${s.projectName} · ${SPRINT_STATUS[s.status].label}`, hint: s.goal || undefined,
        run: go(ROUTES.project(s.projectKey, 'sprints')),
      });
    }
    for (const u of data?.users ?? []) {
      list.push({
        id: `user:${u.id}`, group: 'People',
        icon: <span className="flex size-7 items-center justify-center"><UserAvatar userId={u.id} size={22} noTooltip /></span>,
        title: u.fullName, meta: `@${u.username} · ${u.position}`,
        run: go(can('user.manage') ? `${ROUTES.USERS}?search=${encodeURIComponent(u.username)}` : `${ROUTES.REPORTS}?type=daily&userId=${u.id}`),
      });
    }
    if (can('user.manage') || can('team.manage')) {
      for (const t of data?.teams ?? []) {
        list.push({
          id: `team:${t.id}`, group: 'Teams', icon: <NavIcon name="team" />,
          title: t.name, meta: `${t.memberCount} members`,
          trailing: <UserAvatar userId={t.leadId} size={18} />,
          run: go(can('user.manage') ? `${ROUTES.USERS}?teamId=${t.id}` : ROUTES.TEAMS),
        });
      }
    }
    for (const c of data?.comments ?? []) {
      list.push({
        id: `comment:${c.id}`, group: 'Comments',
        icon: <span className="flex size-7 items-center justify-center"><UserAvatar userId={c.authorId} size={22} noTooltip /></span>,
        code: c.taskKey, title: c.taskTitle, hint: c.snippet,
        run: go(ROUTES.task(c.taskKey)),
      });
    }

    const pages = [...WORK, ...WORKSPACE, ...ADMIN, ...ACCOUNT]
      .filter((p) => (!p.permission || can(p.permission)) && matches(p.label));
    for (const p of pages) {
      list.push({ id: `page:${p.to}`, group: 'Pages', icon: <NavIcon name={p.icon} />, title: p.label, meta: 'Go to page', run: go(p.to) });
    }

    const themeLabel = themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    if (matches(`${themeLabel} theme`)) {
      list.push({
        id: 'action:theme', group: 'Actions', icon: <NavIcon name={themeMode === 'dark' ? 'sun' : 'moon'} />,
        title: themeLabel, run: () => { toggleTheme(); close(); },
      });
    }
    return list;
    // `go`/`close` are recreated each render but only call stable setters/navigate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, q, tokens, role, themeMode, toggleTheme]);

  const current = Math.min(active, Math.max(items.length - 1, 0));

  const move = (delta: number) => {
    if (!items.length) return;
    const next = (current + delta + items.length) % items.length;
    setActive(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const key = value.trim().toUpperCase();
      if (TASK_KEY_RE.test(key) && !items.some((i) => i.code === key)) go(ROUTES.task(key))();
      else items[current]?.run();
    }
  };

  let lastGroup = '';
  const typing = value.trim() !== q;

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      closable={false}
      width={680}
      style={{ top: '12vh' }}
      styles={{ content: { padding: 0, overflow: 'hidden' } }}
      afterOpenChange={(o) => o && inputRef.current?.focus()}
    >
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <Icon name="search" size={18} className="shrink-0 text-fg-3" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          placeholder="Search tasks, projects, sprints, people, comments…"
          className="h-full flex-1 border-0 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3"
          aria-label="Search"
        />
        {(isFetching || typing) && value.trim() ? <Spinner size={16} /> : <Kbd>Esc</Kbd>}
      </div>

      <div ref={listRef} className="max-h-[min(60vh,520px)] overflow-y-auto p-2">
        {items.length === 0 && !isFetching && !typing && (
          <div className="flex flex-col items-center gap-1 py-12 text-center">
            <Icon name="search" size={22} className="mb-2 text-fg-3" />
            <span className="text-fg">No results for “{q}”</span>
            <span className="text-xs text-fg-3">Try a task key like CRM-110, a person’s name or a label.</span>
          </div>
        )}
        {items.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null;
          lastGroup = item.group;
          return (
            <div key={item.id}>
              {header && <div className="px-2 pt-3 pb-1 text-[11px] font-medium tracking-wide text-fg-3 uppercase first:pt-1">{header}</div>}
              <button
                type="button"
                data-index={i}
                onMouseMove={() => current !== i && setActive(i)}
                onClick={item.run}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-2 py-1.5 text-left',
                  i === current && 'bg-surface-2',
                )}
              >
                {item.icon}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] text-fg">
                    {item.code && <span className="shrink-0 font-mono text-xs text-fg-3"><Highlight text={item.code} tokens={tokens} /></span>}
                    <span className="truncate"><Highlight text={item.title} tokens={tokens} /></span>
                    {item.meta && <span className="shrink-0 truncate text-xs text-fg-3">{item.meta}</span>}
                  </span>
                  {item.hint && <span className="truncate text-xs text-fg-3"><Highlight text={item.hint} tokens={tokens} /></span>}
                </span>
                {item.trailing}
                {i === current && <Icon name="arrowRight" size={14} className="shrink-0 text-fg-3" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-fg-3">
        <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
        <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
        {q && <span className="ml-auto">{items.length} results</span>}
      </div>
    </Modal>
  );
};
