import { useParams } from 'react-router-dom';

import { PageHeader } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';

import { TaskDetailView } from '../components/detail/TaskDetail';

export const TaskPage = () => {
  const { taskKey = '' } = useParams();
  return (
    <>
      <PageHeader breadcrumb={[{ label: 'Projects', to: ROUTES.PROJECTS }, { label: taskKey.split('-')[0], to: ROUTES.project(taskKey.split('-')[0]) }]} title={taskKey} />
      <div className="mx-auto max-w-[1100px] p-6">
        <TaskDetailView taskKey={taskKey} />
      </div>
    </>
  );
};
