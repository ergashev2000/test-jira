import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, Rocket01Icon } from '@hugeicons/core-free-icons';
import { Progress } from 'antd';
import { useNavigate } from 'react-router-dom';

import { ProjectIcon, UserAvatar } from '@/shared/components/ui';
import { PROJECT_STATUS, ROUTES } from '@/shared/constants';
import type { ProjectStatus } from '@/shared/types';
import { formatDate } from '@/shared/utils';

import type { Project } from '../types/project.types';

const COLUMNS: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'archived'];
const COLORS: Record<ProjectStatus, string> = {
  planning: '#8a8f98', active: '#f2c94c', on_hold: '#f2994a', completed: '#165dff', archived: '#6b6f76',
};

const Card = ({ p }: { p: Project }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(ROUTES.project(p.id))}
      className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-center gap-2">
        <ProjectIcon projectKey={p.key} />
        <span className="flex-1 truncate text-[13px] font-medium text-fg">{p.name}</span>
        <UserAvatar user={p.manager} size={18} />
      </div>
      {p.end_date && (
        <span className="flex items-center gap-1.5 text-xs text-fg-2"><HugeiconsIcon icon={Calendar03Icon} size={13} className="hicon" strokeWidth={1.7} />{formatDate(p.end_date)}</span>
      )}
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <span>{p.tasks_total ?? 0} tasks</span>
        {p.active_sprint && <span className="flex items-center gap-1"><HugeiconsIcon icon={Rocket01Icon} size={12} className="hicon" strokeWidth={1.7} />{p.active_sprint.name}</span>}
        <Progress percent={p.progress ?? 0} size="small" showInfo={false} className="!m-0 flex-1" strokeColor="#165dff" />
        <span className="tabular-nums">{p.progress ?? 0}%</span>
      </div>
    </button>
  );
};

/** Linear-like board of projects grouped by status. */
export const ProjectsBoard = ({ items }: { items: Project[] }) => (
  <div className="flex h-full gap-3 overflow-x-auto p-4">
    {COLUMNS.map((s) => {
      const list = items.filter((p) => p.status === s);
      return (
        <div key={s} className="flex w-[300px] shrink-0 flex-col rounded-xl bg-bg/40">
          <div className="flex h-10 items-center gap-2 px-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: COLORS[s] }} />
            <span className="font-medium text-fg">{PROJECT_STATUS[s].label}</span>
            <span className="text-fg-3">{list.length}</span>
          </div>
          <div className="flex flex-col gap-2 px-1 pb-2">{list.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      );
    })}
  </div>
);
