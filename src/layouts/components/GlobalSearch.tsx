import { useQuery } from '@tanstack/react-query';
import { AutoComplete, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InputRef } from 'antd';

import { globalSearch } from '@/modules/tasks';
import { QUERY_KEYS, ROUTES } from '@/shared/constants';
import { useDebounce } from '@/shared/hooks';
import { TASK_KEY_RE } from '@/shared/utils';

import { Icon } from '@/shared/components/ui/Icon';
import { ProjectIcon } from '@/shared/components/ui/ProjectIcon';
import { StatusIcon } from '@/shared/components/ui/icons';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';

const Group = ({ title }: { title: string }) => <span className="text-[11px] uppercase tracking-wide text-fg-3">{title}</span>;

/** Search tasks / projects / users. Typing a full key (CRM-110) + Enter opens the task. */
export const GlobalSearch = () => {
  const navigate = useNavigate();
  const inputRef = useRef<InputRef>(null);
  const [value, setValue] = useState('');
  const q = useDebounce(value.trim(), 300);
  const { data, isFetching } = useQuery({ queryKey: QUERY_KEYS.tasks.search(q), queryFn: () => globalSearch(q), enabled: q.length >= 2 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (v: string) => {
    setValue('');
    inputRef.current?.blur();
    const [kind, id] = v.split(':');
    if (kind === 'task') navigate(ROUTES.task(id));
    if (kind === 'project') navigate(ROUTES.project(id));
    if (kind === 'user') navigate(`${ROUTES.REPORTS}?type=daily&userId=${id}`);
  };

  const options = data && q.length >= 2 ? [
    ...(data.tasks.length ? [{ label: <Group title="Tasks" />, options: data.tasks.map((t) => ({ value: `task:${t.key}`, label: (
      <span className="flex items-center gap-2"><StatusIcon status={t.status} size={12} /><span className="font-mono text-xs text-fg-3">{t.key}</span><span className="truncate">{t.title}</span></span>) })) }] : []),
    ...(data.projects.length ? [{ label: <Group title="Projects" />, options: data.projects.map((p) => ({ value: `project:${p.key}`, label: (
      <span className="flex items-center gap-2"><ProjectIcon projectKey={p.key} size={14} />{p.name}<span className="text-xs text-fg-3">{p.key}</span></span>) })) }] : []),
    ...(data.users.length ? [{ label: <Group title="Users" />, options: data.users.map((u) => ({ value: `user:${u.id}`, label: (
      <span className="flex items-center gap-2"><UserAvatar userId={u.id} size={16} noTooltip />{u.fullName}<span className="text-xs text-fg-3">{u.position}</span></span>) })) }] : []),
  ] : [];

  return (
    <AutoComplete
      className="w-full max-w-[560px]"
      value={value}
      options={options}
      onChange={setValue}
      onSelect={go}
      popupMatchSelectWidth
      notFoundContent={q.length >= 2 && !isFetching ? <span className="text-fg-3">No results</span> : null}
    >
      <Input
        ref={inputRef}
        className="header-search"
        prefix={<Icon name="search" size={16} className="mr-1 text-fg-3" />}
        suffix={<kbd className="rounded border border-line px-1 text-[10px] text-fg-3">Ctrl K</kbd>}
        placeholder="Search tasks, projects, people…"
        onPressEnter={() => {
          const key = value.trim().toUpperCase();
          if (TASK_KEY_RE.test(key)) go(`task:${key}`);
        }}
      />
    </AutoComplete>
  );
};
