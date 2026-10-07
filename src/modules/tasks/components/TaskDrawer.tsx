import { Drawer } from 'antd';

import { useTaskDrawer } from '../hooks/useTaskUi';
import { TaskDetailView } from './detail/TaskDetail';

/** Mounted once in the layout; opens whenever the URL has ?task=ID. */
export const TaskDrawer = () => {
  const { taskId, closeTask } = useTaskDrawer();
  return (
    <Drawer
      open={!!taskId}
      onClose={closeTask}
      width="min(920px, 100vw)"
      closable={false}
      destroyOnHidden
      styles={{ body: { padding: 24 } }}
    >
      {taskId && <TaskDetailView taskId={taskId} inDrawer />}
    </Drawer>
  );
};
