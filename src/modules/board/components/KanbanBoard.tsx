import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon } from '@hugeicons/core-free-icons';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Button } from 'antd';
import { useState } from 'react';

import { useStatusChanger, useTaskDrawer, type TaskRow } from '@/modules/tasks';
import { StatusIcon } from '@/shared/components/ui';
import { BOARD_COLUMNS, TASK_STATUS } from '@/shared/constants';
import type { TaskStatus } from '@/shared/types';
import { cn } from '@/shared/utils';

import { TaskCard, TaskCardView } from './TaskCard';

const Column = ({ status, tasks, onAdd, onOpen }: {
  status: TaskStatus; tasks: TaskRow[]; onAdd?: () => void; onOpen: (key: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="flex h-10 items-center gap-2 px-2 text-[13px]">
        <StatusIcon status={status} />
        <span className="font-medium text-fg">{TASK_STATUS[status].label}</span>
        <span className="text-fg-3">{tasks.length}</span>
        {onAdd && (
          <Button size="small" type="text" className="!ml-auto" icon={<HugeiconsIcon icon={Add01Icon} size={14} className="hicon" strokeWidth={1.7} />} onClick={onAdd} aria-label={`Add to ${TASK_STATUS[status].label}`} />
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-40 flex-1 flex-col gap-2 rounded-xl p-1.5 transition-colors',
          isOver ? 'bg-primary/10 ring-1 ring-primary/40' : 'bg-bg/40',
        )}
      >
        {tasks.map((t) => <TaskCard key={t.id} task={t} onOpen={onOpen} />)}
        {!tasks.length && <div className="py-6 text-center text-xs text-fg-3">No tasks</div>}
      </div>
    </div>
  );
};

interface Props {
  tasks: TaskRow[];
  onQuickAdd?: (status: TaskStatus) => void;
}

/** 5 fixed columns. Cancelled tasks never appear; blocked tasks stay in their column. */
export const KanbanBoard = ({ tasks, onQuickAdd }: Props) => {
  const { openTask } = useTaskDrawer();
  const { change } = useStatusChanger();
  const [active, setActive] = useState<TaskRow | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current?.task as TaskRow) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const task = e.active.data.current?.task as TaskRow | undefined;
    const to = e.over?.id as TaskStatus | undefined;
    if (!task || !to || task.status === to) return;
    change(task, to);
  };

  const visible = tasks.filter((t) => t.status !== 'CANCELLED');

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {BOARD_COLUMNS.map((s) => (
          <Column
            key={s}
            status={s}
            tasks={visible.filter((t) => t.status === s)}
            onOpen={openTask}
            onAdd={onQuickAdd && (s === 'BACKLOG' || s === 'TODO') ? () => onQuickAdd(s) : undefined}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{active && <TaskCardView task={active} overlay />}</DragOverlay>
    </DndContext>
  );
};
