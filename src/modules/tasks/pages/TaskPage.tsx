import { useParams } from 'react-router-dom';

import { PageHeader } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';

import { TaskDetailView } from '../components/detail/TaskDetail';
import { useTaskDetail } from '../hooks/useTasks';

/** /tasks/:taskKey — the param is the task id (GET /tasks/{id}/). */
export const TaskPage = () => {
  const { taskKey = '' } = useParams();
  const { data: task } = useTaskDetail(taskKey);
  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Projects', to: ROUTES.PROJECTS }, ...(task ? [{ label: task.project.key, to: ROUTES.project(task.project.id) }] : [])]}
        title={task?.key ?? taskKey} />
      <div className="mx-auto max-w-[1100px] p-6">
        <TaskDetailView taskKey={taskKey} />
      </div>
    </>
  );
};
