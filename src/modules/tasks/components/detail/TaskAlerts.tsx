import { Alert, App, Button, Popconfirm, Space } from 'antd';

import { useCurrentUser } from '@/shared/hooks';
import { canBlock, errorMessage, fromNow, isManager } from '@/shared/utils';

import { usePendingCancelRequest, useResolveBlocker, useReviewCancel } from '../../hooks/useTaskActions';
import type { Task } from '../../types/task.types';

export const TaskAlerts = ({ task }: { task: Task }) => {
  const user = useCurrentUser();
  const { message } = App.useApp();
  const resolve = useResolveBlocker();
  const review = useReviewCancel();
  const { data: req } = usePendingCancelRequest(task.id);
  const blocker = task.active_blocker;

  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {task.project.status === 'archived' && <Alert type="warning" showIcon message="This project is archived. The task is read-only." />}
      {task.is_blocked && blocker && (
        <Alert
          type="error"
          showIcon
          message={<span>🚧 Blocked by <b>{blocker.created_by?.full_name ?? 'Unknown'}</b>, {fromNow(blocker.created_at)} — {blocker.reason}</span>}
          action={
            canBlock(user, task) && (
              <Popconfirm
                title="Resolve blocker?"
                description="The blocker stays in the task history."
                onConfirm={() =>
                  resolve.mutateAsync(task.id).then(() => message.success('Blocker resolved')).catch((e) => message.error(errorMessage(e)))
                }
              >
                <Button size="small" loading={resolve.isPending}>Resolve blocker</Button>
              </Popconfirm>
            )
          }
        />
      )}
      {task.status === 'cancelled' && (
        <Alert
          type="info"
          showIcon
          message={<span>Cancelled{task.cancellation_reason && <>: <b>{task.cancellation_reason}</b></>}</span>}
        />
      )}
      {req && (
        <Alert
          type="warning"
          showIcon
          message={
            <span>
              Cancel request pending from <b>{req.requested_by.full_name}</b>: {req.reason}
            </span>
          }
          action={
            isManager(user) && (
              <Space>
                <Button
                  size="small"
                  danger
                  loading={review.isPending}
                  onClick={() => review.mutate({ taskId: task.id, approve: true }, {
                    onSuccess: () => message.success('Task cancelled'), onError: (e) => message.error(errorMessage(e)) })}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  onClick={() => review.mutate({ taskId: task.id, approve: false }, {
                    onSuccess: () => message.info('Request rejected'), onError: (e) => message.error(errorMessage(e)) })}
                >
                  Reject
                </Button>
              </Space>
            )
          }
        />
      )}
    </div>
  );
};
