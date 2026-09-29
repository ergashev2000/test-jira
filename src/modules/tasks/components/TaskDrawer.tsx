import { Drawer } from 'antd';

import { useTaskDrawer } from '../hooks/useTaskUi';
import { TaskDetailView } from './detail/TaskDetail';

/** Mounted once in the layout; opens whenever the URL has ?task=KEY. */
export const TaskDrawer = () => {
  const { taskKey, closeTask } = useTaskDrawer();
  return (
    <Drawer
      open={!!taskKey}
      onClose={closeTask}
      width="min(920px, 100vw)"
      closable={false}
      destroyOnHidden
      styles={{ body: { padding: 24 } }}
    >
      {taskKey && <TaskDetailView taskKey={taskKey} inDrawer />}
    </Drawer>
  );
};
