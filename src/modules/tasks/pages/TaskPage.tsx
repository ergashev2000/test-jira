import { useParams } from 'react-router-dom';

import { PageHeader } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';

import { TaskDetailView } from '../components/detail/TaskDetail';
import { useTaskDetail } from '../hooks/useTasks';

export const TaskPage = () => {
  const { taskId = '' } = useParams();
  const { data: task } = useTaskDetail(taskId);
  return (
    <>
      <PageHeader breadcrumb={[{ label: 'Projects', to: ROUTES.PROJECTS }, { label: task?.project.key ?? 'Task' }]} title={task?.key ?? 'Task'} />
      <div className="mx-auto max-w-[1100px] p-6">
        <TaskDetailView taskId={taskId} />
      </div>
    </>
  );
};
