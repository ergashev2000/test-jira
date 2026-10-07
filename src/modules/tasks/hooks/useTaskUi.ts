import { App } from 'antd';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { TASK_STATUS } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import type { Task, TaskStatus } from '@/shared/types';
import { checkTransition, errorMessage } from '@/shared/utils';

import { useChangeStatus } from './useTasks';

/** Opens the Task drawer by adding `?task=<id>` to the current URL (shareable) — loaded with GET /tasks/{id}/. */
export const useTaskDrawer = () => {
  const [sp, setSp] = useSearchParams();
  const openTask = useCallback(
    (id: number | string) =>
      setSp((prev) => {
        const next = new URLSearchParams(prev);
        next.set('task', String(id));
        return next;
      }),
    [setSp],
  );
  const closeTask = useCallback(
    () =>
      setSp((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('task');
        return next;
      }),
    [setSp],
  );
  return { taskId: sp.get('task'), openTask, closeTask };
};

/**
 * Single entry point for status changes from anywhere (board drag, dropdowns, detail).
 * Pre-checks obvious rules, confirms reopen, then mutates optimistically. The backend decides the
 * final status (e.g. "done" → "review" when the project requires review).
 */
export const useStatusChanger = () => {
  const { message, modal } = App.useApp();
  const user = useSessionStore((s) => s.user);
  const mutation = useChangeStatus();

  const change = useCallback(
    (task: Pick<Task, 'id' | 'key' | 'status' | 'assignee' | 'reviewer'>, to: TaskStatus) => {
      if (!user) return false;
      const r = checkTransition(user, task, to);
      if (!r.ok) {
        message.warning(r.reason);
        return false;
      }
      const run = () =>
        mutation.mutate(
          { id: task.id, status: to, from: task.status },
          {
            onSuccess: (saved) =>
              saved.status !== to
                ? message.info(`${task.key} → ${TASK_STATUS[saved.status].label}`)
                : message.success(`${task.key} → ${TASK_STATUS[saved.status].label}`),
            onError: (e) => message.error(errorMessage(e)),
          },
        );
      if (r.reopen) {
        modal.confirm({
          title: `Reopen ${task.key}?`,
          content: `The task will move from Done to ${TASK_STATUS[to].label}. This is recorded in the task history.`,
          okText: 'Reopen',
          onOk: run,
        });
      } else run();
      return true;
    },
    [user, mutation, message, modal],
  );

  return { change, isPending: mutation.isPending };
};
