import { App, Button, Input, Tooltip } from 'antd';
import { useState } from 'react';

import { EmptyState, QueryState, UserAvatar } from '@/shared/components/ui';
import { useUserMap } from '@/shared/api/lookups';
import { useSessionStore } from '@/shared/lib/session';
import type { TaskComment } from '@/shared/types';
import { errorMessage, formatDateTime, fromNow } from '@/shared/utils';

import { useAddComment, useComments, useEditComment } from '../../hooks/useTaskActions';

const CommentItem = ({ c }: { c: TaskComment }) => {
  const me = useSessionStore((s) => s.user)!;
  const users = useUserMap();
  const { message } = App.useApp();
  const edit = useEditComment();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.text);

  const save = () =>
    edit.mutate({ id: c.id, text }, { onSuccess: () => setEditing(false), onError: (e) => message.error(errorMessage(e)) });

  return (
    <div className="flex gap-3">
      <UserAvatar userId={c.authorId} size={24} />
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2">
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className="font-medium text-fg">{users.get(c.authorId)?.fullName}</span>
          <Tooltip title={formatDateTime(c.createdAt)}><span className="text-fg-3">{fromNow(c.createdAt)}</span></Tooltip>
          {c.editedAt && <span className="text-fg-3">(edited)</span>}
          {c.authorId === me.id && !editing && (
            <Button size="small" type="link" className="!ml-auto !h-auto !p-0 !text-xs" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input.TextArea autoSize={{ minRows: 2 }} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && save()} />
            <div className="flex justify-end gap-2">
              <Button size="small" onClick={() => { setEditing(false); setText(c.text); }}>Cancel</Button>
              <Button size="small" type="primary" loading={edit.isPending} disabled={!text.trim()} onClick={save}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="m-0 whitespace-pre-wrap text-[13px] text-fg">{c.text}</p>
        )}
      </div>
    </div>
  );
};

export const TaskComments = ({ taskId }: { taskId: string }) => {
  const me = useSessionStore((s) => s.user)!;
  const { message } = App.useApp();
  const query = useComments(taskId);
  const add = useAddComment();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    add.mutate({ taskId, text }, { onSuccess: () => setText(''), onError: (e) => message.error(errorMessage(e)) });
  };

  return (
    <div className="flex flex-col gap-4">
      <QueryState query={query} isEmpty={(d) => !d.length} empty={<EmptyState description="No comments yet" />}>
        {(list) => <div className="flex flex-col gap-3">{list.map((c) => <CommentItem key={c.id} c={c} />)}</div>}
      </QueryState>
      <div className="flex gap-3">
        <UserAvatar userId={me.id} size={24} />
        <div className="flex-1 rounded-xl border border-line bg-surface p-2 focus-within:border-line-strong">
          <Input.TextArea
            variant="borderless"
            autoSize={{ minRows: 2, maxRows: 8 }}
            placeholder="Leave a comment…  (Ctrl+Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && submit()}
          />
          <div className="flex justify-end">
            <Button type="primary" size="small" loading={add.isPending} disabled={!text.trim()} onClick={submit}>Comment</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
