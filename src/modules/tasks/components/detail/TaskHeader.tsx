import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowExpand01Icon, Edit02Icon, Link01Icon, MoreHorizontalIcon, StopCircleIcon } from '@hugeicons/core-free-icons';
import { App, Button, Dropdown, Tag, Tooltip, Typography } from 'antd';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ReasonModal, TaskTypeIcon, type ReasonValues } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import type { CancelReason } from '@/shared/types';
import { canBlock, canCancelDirect, canEditTask, canRequestCancel, copyToClipboard, errorMessage } from '@/shared/utils';

import { useBlockTask, useCancelTask, useRequestCancel } from '../../hooks/useTaskActions';
import { useUpdateTask } from '../../hooks/useTasks';
import type { TaskDetail } from '../../types/task.types';
import { TaskFormModal } from '../TaskFormModal';

export const TaskHeader = ({ task, inDrawer }: { task: TaskDetail; inDrawer?: boolean }) => {
  const user = useSessionStore((s) => s.user)!;
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [modal, setModal] = useState<'block' | 'cancel' | 'request' | 'edit' | null>(null);
  const block = useBlockTask();
  const cancel = useCancelTask();
  const request = useRequestCancel();
  const update = useUpdateTask();

  const closed = task.status === 'CANCELLED';
  const readOnly = task.projectArchived || closed;
  const editable = canEditTask(user) && !readOnly;

  const onReason = ({ reason, note }: ReasonValues) => {
    const done = (msg: string) => ({ onSuccess: () => { message.success(msg); setModal(null); }, onError: (e: unknown) => message.error(errorMessage(e)) });
    if (modal === 'block') block.mutate({ id: task.id, reason: note }, done('Task marked as blocked'));
    if (modal === 'cancel') cancel.mutate({ id: task.id, payload: { reason: reason as CancelReason, note } }, done('Task cancelled'));
    if (modal === 'request') request.mutate({ id: task.id, payload: { reason: reason as CancelReason, note } }, done('Cancel request sent to your lead'));
  };

  const menu = [
    canCancelDirect(user) && !readOnly && { key: 'cancel', label: 'Cancel task', danger: true, icon: <HugeiconsIcon icon={StopCircleIcon} size={16} className="hicon" strokeWidth={1.7} /> },
    canRequestCancel(user, task) && !readOnly && !task.pendingCancelRequest && { key: 'request', label: 'Request cancel', icon: <HugeiconsIcon icon={StopCircleIcon} size={16} className="hicon" strokeWidth={1.7} /> },
  ].filter((x): x is Exclude<typeof x, false> => !!x);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-fg-2">
        <TaskTypeIcon type={task.type} />
        <span className="font-mono">{task.key}</span>
        <Tooltip title="Copy link">
          <Button size="small" type="text" icon={<HugeiconsIcon icon={Link01Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => {
            copyToClipboard(`${window.location.origin}${ROUTES.task(task.key)}`);
            message.success('Link copied');
          }} />
        </Tooltip>
        {task.pendingCancelRequest && <Tag color="orange">Cancel request pending</Tag>}
        <div className="ml-auto flex items-center gap-1.5">
          {!readOnly && canBlock(user, task) && !task.isBlocked && (
            <Button size="small" onClick={() => setModal('block')}>🚧 Block</Button>
          )}
          {editable && <Button size="small" icon={<HugeiconsIcon icon={Edit02Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => setModal('edit')}>Edit</Button>}
          {inDrawer && (
            <Tooltip title="Open in full page">
              <Button size="small" type="text" icon={<HugeiconsIcon icon={ArrowExpand01Icon} size={16} className="hicon" strokeWidth={1.7} />} onClick={() => navigate(ROUTES.task(task.key))} />
            </Tooltip>
          )}
          {menu.length > 0 && (
            <Dropdown trigger={['click']} menu={{ items: menu, onClick: ({ key }) => setModal(key as 'cancel' | 'request') }}>
              <Button size="small" type="text" icon={<HugeiconsIcon icon={MoreHorizontalIcon} size={16} className="hicon" strokeWidth={1.7} />} />
            </Dropdown>
          )}
        </div>
      </div>

      <Typography.Title
        level={4}
        className={`!m-0 !text-xl !font-semibold ${closed ? 'line-through opacity-60' : ''}`}
        editable={editable ? {
          triggerType: ['text'],
          onChange: (title) => title.trim() && title !== task.title &&
            update.mutate({ id: task.id, patch: { title } }, { onError: (e) => message.error(errorMessage(e)) }),
        } : false}
      >
        {task.title}
      </Typography.Title>

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
