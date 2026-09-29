import { Progress } from 'antd';
import { useNavigate } from 'react-router-dom';

import { Icon, ProjectIcon, UserAvatar } from '@/shared/components/ui';
import { PROJECT_STATUS, ROUTES } from '@/shared/constants';
import type { ProjectStatus } from '@/shared/types';
import { formatDate } from '@/shared/utils';

import type { ProjectListItem } from '../types/project.types';

const COLUMNS: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];
const COLORS: Record<ProjectStatus, string> = {
  PLANNING: '#8a8f98', ACTIVE: '#f2c94c', ON_HOLD: '#f2994a', COMPLETED: '#5e6ad2', ARCHIVED: '#6b6f76',
};

const Card = ({ p }: { p: ProjectListItem }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(ROUTES.project(p.key))}
      className="flex w-full cursor-pointer flex-col gap-2 rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-center gap-2">
        <ProjectIcon projectKey={p.key} />
        <span className="flex-1 truncate text-[13px] font-medium text-fg">{p.name}</span>
        <UserAvatar userId={p.managerId} size={18} />
      </div>
      {p.endDate && (
        <span className="flex items-center gap-1.5 text-xs text-fg-2"><Icon name="calendar" size={13} />{formatDate(p.endDate)}</span>
      )}
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <span>{p.totalTasks} tasks</span>
        {p.activeSprint && <span className="flex items-center gap-1"><Icon name="sprint" size={12} />{p.activeSprint.name}</span>}
        <Progress percent={p.progress} size="small" showInfo={false} className="!m-0 flex-1" strokeColor="#5e6ad2" />
        <span className="tabular-nums">{p.progress}%</span>
      </div>
    </button>
  );
};

/** Linear-like board of projects grouped by status. */
export const ProjectsBoard = ({ items }: { items: ProjectListItem[] }) => (
  <div className="flex h-full gap-3 overflow-x-auto p-4">
    {COLUMNS.map((s) => {
      const list = items.filter((p) => p.status === s);
      return (
        <div key={s} className="flex w-[300px] shrink-0 flex-col rounded-lg bg-bg/40">
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
