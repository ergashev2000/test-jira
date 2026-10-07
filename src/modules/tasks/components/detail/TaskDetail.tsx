import { Result, Skeleton, Tabs } from 'antd';

import { ActivityTimeline, ErrorState, QueryState } from '@/shared/components/ui';
import { ApiError } from '@/shared/lib/apiError';

import { useTaskActivity } from '../../hooks/useTaskActions';
import { useTaskDetail } from '../../hooks/useTasks';
import { BlockerHistory } from './BlockerHistory';
import { TaskAlerts } from './TaskAlerts';
import { TaskAttachments } from './TaskAttachments';
import { TaskComments } from './TaskComments';
import { TaskDescription } from './TaskDescription';
import { TaskHeader } from './TaskHeader';
import { TaskMeta } from './TaskMeta';

const Activity = ({ taskId }: { taskId: number }) => {
  const query = useTaskActivity(taskId);
  return <QueryState query={query}>{(d) => <ActivityTimeline items={d} />}</QueryState>;
};

/** Shared by the Drawer (?task=ID) and the full page (/tasks/:id). */
export const TaskDetailView = ({ taskId, inDrawer }: { taskId: string; inDrawer?: boolean }) => {
  const { data: task, isLoading, isError, error, refetch } = useTaskDetail(taskId);

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return <Result status="403" title="403" subTitle="You don't have access to this task." />;
    }
    if (error instanceof ApiError && error.status === 404) {
      return <Result status="404" title="Task not found" subTitle={`Task ${taskId} doesn't exist.`} />;
    }
    return <ErrorState error={error} onRetry={refetch} />;
  }
  if (!task) return null;

  return (
    <div className="flex flex-col gap-4">
      <TaskHeader task={task} inDrawer={inDrawer} />
      <TaskAlerts task={task} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <TaskDescription task={task} />
          <section>
            <h4 className="mb-2 text-xs font-medium text-fg-3">Attachments</h4>
            <TaskAttachments taskId={task.id} disabled={task.project.status === 'archived'} />
          </section>
          <Tabs
            size="small"
            items={[
              { key: 'comments', label: 'Comments', children: <TaskComments taskId={task.id} /> },
              { key: 'activity', label: 'Activity', children: <Activity taskId={task.id} /> },
              { key: 'blockers', label: 'Blocker history', children: <BlockerHistory taskId={task.id} /> },
            ]}
          />
        </div>
        <aside className="h-fit rounded-xl border border-line bg-surface px-3 py-2 lg:sticky lg:top-0">
          <TaskMeta task={task} />
        </aside>
      </div>
    </div>
  );
};
