import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon } from '@hugeicons/core-free-icons';
import { App, Button } from 'antd';
import { useState } from 'react';

import { RichTextEditor, RichTextView } from '@/shared/components/ui';
import { useCurrentUser } from '@/shared/hooks';
import { canEditTask, errorMessage } from '@/shared/utils';

import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';

export const TaskDescription = ({ task }: { task: Task }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const update = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const editable = canEditTask(user) && task.project.status !== 'archived' && task.status !== 'cancelled';
  const empty = !task.description?.trim();

  const onSave = (description: string) => {
    if (description === (task.description ?? '')) return setEditing(false);
    update.mutate({ task, patch: { description } }, {
      onSuccess: () => { message.success('Description saved'); setEditing(false); },
      onError: (e) => message.error(errorMessage(e)),
    });
  };

  return (
    <section>
      <div className="mb-2 flex h-6 items-center">
        <h4 className="m-0 text-xs font-medium text-fg-3">Description</h4>
        {editable && !editing && !empty && (
          <Button size="small" type="text" className="!ml-auto" onClick={() => setEditing(true)}
            icon={<HugeiconsIcon icon={Edit02Icon} size={13} className="hicon" strokeWidth={1.7} />}>
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <RichTextEditor value={task.description} placeholder="Add a description…" saving={update.isPending}
          onSave={onSave} onCancel={() => setEditing(false)} />
      ) : empty ? (
        editable ? (
          <button type="button" onClick={() => setEditing(true)}
            className="w-full cursor-text rounded-lg border border-dashed border-line bg-transparent px-3 py-3 text-left text-[13px] text-fg-3 hover:border-line-strong hover:text-fg-2">
            Add a description…
          </button>
        ) : (
          <div className="text-[13px] text-fg-3">No description</div>
        )
      ) : (
        // Double-click edits, like before; links inside stay clickable.
        <div onDoubleClick={() => editable && setEditing(true)} className={editable ? 'cursor-text' : undefined}>
          <RichTextView value={task.description} className="text-[14px] leading-6 text-fg" />
        </div>
      )}
    </section>
  );
};
