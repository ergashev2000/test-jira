import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon } from '@hugeicons/core-free-icons';
import { Alert, Button, Result, Skeleton, Tabs, Tag } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, PageHeader, ProjectIcon, UserAvatar, UserAvatarGroup } from '@/shared/components/ui';
import { PROJECT_STATUS, ROUTES } from '@/shared/constants';
import { ApiError } from '@/shared/lib/mock';

import { ProjectFormModal } from '../components/ProjectFormModal';
import { useProject } from '../hooks/useProjects';

const TABS = ['overview', 'board', 'backlog', 'sprints', 'members', 'reports', 'activity'] as const;

/** Current project for nested tab routes (reads :projectKey; cached query). */
export const useCurrentProject = () => {
  const { projectKey = '' } = useParams();
  return useProject(projectKey);
};

export const ProjectLayout = () => {
  const { projectKey = '' } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const { data: project, isLoading, isError, error, refetch } = useProject(projectKey);
  const tab = TABS.find((t) => pathname.endsWith(`/${t}`)) ?? 'overview';

  if (isLoading) return <div className="p-6"><Skeleton active /></div>;
  if (isError || !project) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return <Result status={error.status === 403 ? '403' : '404'} title={error.status} subTitle={error.message}
        extra={<Button onClick={() => navigate(ROUTES.PROJECTS)}>Back to projects</Button>} />;
    }
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        breadcrumb={[{ label: 'Projects', to: ROUTES.PROJECTS }]}
        icon={<ProjectIcon projectKey={project.key} />}
        title={project.name}
        extra={
          <>
            <span className="font-mono text-xs text-fg-3">{project.key}</span>
            <Tag color={PROJECT_STATUS[project.status].color} className="!m-0">{PROJECT_STATUS[project.status].label}</Tag>
            <UserAvatar userId={project.managerId} size={22} />
            <UserAvatarGroup userIds={project.memberIds} size={22} />
            {project.canEdit && (
              <Button size="small" icon={<HugeiconsIcon icon={Edit02Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={() => setEditing(true)}>Edit</Button>
            )}
          </>
        }
      />
      {project.status === 'ARCHIVED' && (
        <Alert type="warning" showIcon banner message="This project is archived. You can't create new tasks." />
      )}
      <div className="border-b border-line px-5">
        <Tabs
          activeKey={tab}
          className="!-mb-px"
          onChange={(k) => navigate({ pathname: ROUTES.project(project.key, k), search: k === tab ? search : '' })}
          items={TABS.map((t) => ({ key: t, label: t[0].toUpperCase() + t.slice(1) }))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </div>
      <ProjectFormModal open={editing} project={project} onClose={() => setEditing(false)} />
    </div>
  );
};
