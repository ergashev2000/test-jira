import { App } from 'antd';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppSettings } from '@/modules/settings';
import { TASK_STATUS } from '@/shared/constants';
import { useSessionStore } from '@/shared/lib/session';
import type { Task, TaskStatus } from '@/shared/types';
import { errorMessage, resolveTransition } from '@/shared/utils';

import { useChangeStatus } from './useTasks';

/** Opens the Task drawer by adding `?task=KEY` to the current URL (shareable). */
export const useTaskDrawer = () => {
  const [sp, setSp] = useSearchParams();
  const openTask = useCallback(
    (key: string) =>
      setSp((prev) => {
        const next = new URLSearchParams(prev);
        next.set('task', key);
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
  return { taskKey: sp.get('task'), openTask, closeTask };
};

/**
 * Single entry point for status changes from anywhere (board drag, dropdowns, detail).
 * Validates rules client-side first, confirms reopen, then mutates optimistically.
 */
export const useStatusChanger = () => {
  const { message, modal } = App.useApp();
  const user = useSessionStore((s) => s.user);
  const { data: settings } = useAppSettings();
  const mutation = useChangeStatus();

  const change = useCallback(
    (task: Pick<Task, 'id' | 'key' | 'status' | 'assigneeId' | 'reviewerId'>, to: TaskStatus) => {
      if (!user) return false;
      const r = resolveTransition(user, task, to, settings?.tasks.requireReview ?? true);
      if (!r.ok) {
        message.warning(r.reason);
        return false;
      }
      const run = () =>
        mutation.mutate(
          { id: task.id, status: to, optimistic: r.status },
          {
            onSuccess: (res) =>
              res.note
                ? message.info(`${task.key}: ${res.note}`)
                : message.success(`${task.key} → ${TASK_STATUS[res.task.status].label}`),
            onError: (e) => message.error(errorMessage(e)),
          },
        );
      if (r.reopen) {
        modal.confirm({
          title: `Reopen ${task.key}?`,
          content: `The task will move from Done to ${TASK_STATUS[r.status].label}. This is recorded in the task history.`,
          okText: 'Reopen',
          onOk: run,
        });
      } else run();
      return true;
    },
    [user, settings, mutation, message, modal],
  );

  return { change, isPending: mutation.isPending };
};
