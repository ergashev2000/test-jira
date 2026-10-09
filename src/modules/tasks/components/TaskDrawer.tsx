import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowExpand01Icon, ArrowShrink02Icon, Cancel01Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons';
import { Button, Drawer, Tooltip } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/shared/constants';

import { useTaskDrawer } from '../hooks/useTaskUi';
import { useTaskViewMode } from '../hooks/useTaskViewMode';
import { TaskDetailView } from './detail/TaskDetail';

const PANEL_WIDTH = 'min(560px, 45vw)';

const ToolButton = ({ title, icon, onClick }: { title: string; icon: typeof Cancel01Icon; onClick: () => void }) => (
  <Tooltip title={title}>
    <Button size="small" type="text" aria-label={title} onClick={onClick}
      icon={<HugeiconsIcon icon={icon} size={16} className="hicon" strokeWidth={1.7} />} />
  </Tooltip>
);

/** Expand / dock · full page · close — shared by the side panel and the drawer. */
const Toolbar = ({ taskId, docked, canDock }: { taskId: string; docked: boolean; canDock: boolean }) => {
  const navigate = useNavigate();
  const { closeTask } = useTaskDrawer();
  const setMode = useTaskViewMode((s) => s.setMode);
  return (
    <div className="flex items-center justify-end gap-1">
      {docked
        ? <ToolButton title="Expand" icon={ArrowExpand01Icon} onClick={() => setMode('drawer')} />
        : canDock && <ToolButton title="Dock to the side" icon={ArrowShrink02Icon} onClick={() => setMode('panel')} />}
      <ToolButton title="Open in full page" icon={LinkSquare02Icon} onClick={() => navigate(ROUTES.task(taskId))} />
      <ToolButton title="Close" icon={Cancel01Icon} onClick={closeTask} />
    </div>
  );
};

/** Docked task detail beside the page content — squeezes it instead of covering it. Desktop only. */
export const TaskSidePanel = () => {
  const { taskId } = useTaskDrawer();
  return (
    <AnimatePresence initial={false}>
      {taskId && (
        <motion.aside
          key="task-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: PANEL_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="mr-2 mb-2 shrink-0 overflow-hidden"
          aria-label="Task details"
        >
          <div className="flex h-full flex-col rounded-xl border border-line bg-panel" style={{ width: PANEL_WIDTH }}>
            <div className="shrink-0 border-b border-line px-3 py-2">
              <Toolbar taskId={taskId} docked canDock />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <TaskDetailView key={taskId} taskId={taskId} />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

/** Wide overlay; always used on small screens, on desktop only after "Expand". */
export const TaskDrawer = ({ canDock }: { canDock: boolean }) => {
  const { taskId, closeTask } = useTaskDrawer();
  return (
    <Drawer
      open={!!taskId}
      onClose={closeTask}
      width="min(920px, 100vw)"
      closable={false}
      destroyOnHidden
      styles={{ body: { padding: 24, paddingTop: 12 } }}
    >
      {taskId && (
        <div className="flex flex-col gap-2">
          <Toolbar taskId={taskId} docked={false} canDock={canDock} />
          <TaskDetailView taskId={taskId} />
        </div>
      )}
    </Drawer>
  );
};
