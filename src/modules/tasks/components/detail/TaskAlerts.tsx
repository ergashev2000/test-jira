import { Alert, App, Button, Popconfirm, Space } from 'antd';

import { useCurrentUser } from '@/shared/hooks';
import { useUserMap } from '@/shared/api/lookups';
import { CANCEL_REASONS } from '@/shared/constants';
import { canBlock, errorMessage, fromNow, isManager } from '@/shared/utils';

import { useResolveBlocker, useReviewCancel } from '../../hooks/useTaskActions';
import type { TaskDetail } from '../../types/task.types';

export const TaskAlerts = ({ task }: { task: TaskDetail }) => {
  const user = useCurrentUser();
  const users = useUserMap();
  const { message } = App.useApp();
  const resolve = useResolveBlocker();
  const review = useReviewCancel();
  const name = (id: string | null | undefined) => (id && users.get(id)?.fullName) || 'Unknown';

  const req = task.pendingCancelRequest;

  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {task.projectArchived && <Alert type="warning" showIcon message="This project is archived. The task is read-only." />}
      {task.isBlocked && task.activeBlocker && (
        <Alert
          type="error"
          showIcon
          message={<span>🚧 Blocked by <b>{name(task.activeBlocker.createdById)}</b>, {fromNow(task.activeBlocker.createdAt)} — {task.activeBlocker.reason}</span>}
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
      {task.status === 'CANCELLED' && task.cancellation && (
        <Alert
          type="info"
          showIcon
          message={
            <span>
              Cancelled: <b>{CANCEL_REASONS[task.cancellation.reason]}</b>
              {task.cancellation.note && ` — ${task.cancellation.note}`}
              <span className="text-fg-3"> · by {name(task.cancellation.byId)}, {fromNow(task.cancellation.at)}</span>
            </span>
          }
        />
      )}
      {req && (
        <Alert
          type="warning"
          showIcon
          message={
            <span>
              Cancel request pending from <b>{name(req.requestedById)}</b>: {CANCEL_REASONS[req.reason]}
              {req.note && ` — ${req.note}`}
            </span>
          }
          action={
            isManager(user) && (
              <Space>
                <Button
                  size="small"
                  danger
                  loading={review.isPending}
                  onClick={() => review.mutate({ requestId: req.id, approve: true }, {
                    onSuccess: () => message.success('Task cancelled'), onError: (e) => message.error(errorMessage(e)) })}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  onClick={() => review.mutate({ requestId: req.id, approve: false }, {
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
