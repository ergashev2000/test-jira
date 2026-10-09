import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon, Link01Icon, MoreHorizontalIcon, StopCircleIcon } from '@hugeicons/core-free-icons';
import { App, Button, Dropdown, Tag, Tooltip } from 'antd';

import { useState } from 'react';

import { useCurrentUser } from '@/shared/hooks';
import { ReasonModal, TaskTypeIcon, type ReasonValues } from '@/shared/components/ui';
import { CANCEL_REASONS, ROUTES, type CancelReason } from '@/shared/constants';
import { canBlock, canCancelDirect, canEditTask, canRequestCancel, copyToClipboard, errorMessage } from '@/shared/utils';

import { useBlockTask, useCancelTask, usePendingCancelRequest, useRequestCancel } from '../../hooks/useTaskActions';
import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';
import { TaskFormModal } from '../TaskFormModal';
import { InlineEdit } from './InlineEdit';

export const TaskHeader = ({ task }: { task: Task }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const [modal, setModal] = useState<'block' | 'cancel' | 'request' | 'edit' | null>(null);
  const block = useBlockTask();
  const cancel = useCancelTask();
  const request = useRequestCancel();
  const update = useUpdateTask();
  const { data: pendingCancel } = usePendingCancelRequest(task.id);

  const closed = task.status === 'cancelled';
  const readOnly = task.project.status === 'archived' || closed;
  const editable = canEditTask(user) && !readOnly;

  const onReason = ({ reason, note }: ReasonValues) => {
    const done = (msg: string) => ({ onSuccess: () => { message.success(msg); setModal(null); }, onError: (e: unknown) => message.error(errorMessage(e)) });
    // The backend keeps one free-text reason: "<preset> — <note>".
    const text = [reason && CANCEL_REASONS[reason as CancelReason], note].filter(Boolean).join(' — ');
    if (modal === 'block') block.mutate({ id: task.id, reason: note }, done('Task marked as blocked'));
    if (modal === 'cancel') cancel.mutate({ id: task.id, reason: text }, done('Task cancelled'));
    if (modal === 'request') request.mutate({ id: task.id, reason: text }, done('Cancel request sent to your lead'));
  };

  const menu = [
    canCancelDirect(user) && !readOnly && { key: 'cancel', label: 'Cancel task', danger: true, icon: <HugeiconsIcon icon={StopCircleIcon} size={16} className="hicon" strokeWidth={1.7} /> },
    canRequestCancel(user, task) && !readOnly && !pendingCancel && { key: 'request', label: 'Request cancel', icon: <HugeiconsIcon icon={StopCircleIcon} size={16} className="hicon" strokeWidth={1.7} /> },
  ].filter((x): x is Exclude<typeof x, false> => !!x);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-fg-2">
        <TaskTypeIcon type={task.type} />
        <span className="font-mono">{task.key}</span>
        <Tooltip title="Copy link">
          <Button size="small" type="text" icon={<HugeiconsIcon icon={Link01Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => {
            copyToClipboard(`${window.location.origin}${ROUTES.task(task.id)}`);
            message.success('Link copied');
          }} />
        </Tooltip>
        {pendingCancel && <Tag color="orange">Cancel request pending</Tag>}
        <div className="ml-auto flex items-center gap-1.5">
          {!readOnly && canBlock(user, task) && !task.is_blocked && (
            <Button size="small" onClick={() => setModal('block')}>🚧 Block</Button>
          )}
          {editable && <Button size="small" icon={<HugeiconsIcon icon={Edit02Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => setModal('edit')}>Edit</Button>}
          {menu.length > 0 && (
            <Dropdown trigger={['click']} menu={{ items: menu, onClick: ({ key }) => setModal(key as 'cancel' | 'request') }}>
              <Button size="small" type="text" icon={<HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="hicon" strokeWidth={1.7} />} />
            </Dropdown>
          )}
        </div>
      </div>

      <InlineEdit value={task.title} editable={editable} required placeholder="Task title"
        className={`text-xl leading-8 font-semibold text-fg ${closed ? 'line-through opacity-60' : ''}`}
        inputClassName="!text-xl !font-semibold"
        onSave={(title) => update.mutate({ task, patch: { title } }, { onSuccess: () => message.success('Title saved'), onError: (e) => message.error(errorMessage(e)) })} />

      <ReasonModal
        open={modal === 'block' || modal === 'cancel' || modal === 'request'}
        variant={modal === 'block' ? 'block' : 'cancel'}
        title={modal === 'request' ? 'Request cancellation' : undefined}
        okText={modal === 'request' ? 'Send request' : undefined}
        description={modal === 'request' ? 'Your team lead or project manager will review this request.' : undefined}
        loading={block.isPending || cancel.isPending || request.isPending}
        onCancel={() => setModal(null)}
        onSubmit={onReason}
      />
      <TaskFormModal open={modal === 'edit'} task={task} onClose={() => setModal(null)} />
    </div>
  );
};
