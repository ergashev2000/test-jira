import { App } from 'antd';

import { useCurrentUser } from '@/shared/hooks';
import { canEditTask, errorMessage } from '@/shared/utils';

import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';
import { InlineEdit } from './InlineEdit';

/** Description — double-click to edit (PATCH /tasks/{id}/ { description }). */
export const TaskDescription = ({ task }: { task: Task }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const update = useUpdateTask();
  const editable = canEditTask(user) && task.project.status !== 'archived' && task.status !== 'cancelled';

  return (
    <section>
      <h4 className="mb-2 text-xs font-medium text-fg-3">Description</h4>
      <InlineEdit value={task.description} editable={editable} multiline placeholder="No description"
        className="min-h-8 py-1 whitespace-pre-wrap text-[14px] leading-6 text-fg"
        onSave={(description) => update.mutate({ task, patch: { description } }, { onSuccess: () => message.success('Description saved'), onError: (e) => message.error(errorMessage(e)) })} />
    </section>
  );
};
