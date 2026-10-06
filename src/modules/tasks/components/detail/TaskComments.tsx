import { App, Button, Input, Tooltip } from 'antd';
import { useState } from 'react';

import { useCurrentUser } from '@/shared/hooks';
import { EmptyState, QueryState, UserAvatar } from '@/shared/components/ui';
import type { Comment } from '@/shared/types';
import { errorMessage, formatDateTime, fromNow } from '@/shared/utils';

import { useAddComment, useComments, useEditComment } from '../../hooks/useTaskActions';

const CommentItem = ({ c, taskId }: { c: Comment; taskId: number }) => {
  const me = useCurrentUser();
  const { message } = App.useApp();
  const edit = useEditComment();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.text);

  const save = () =>
    edit.mutate({ taskId, id: c.id, text }, { onSuccess: () => setEditing(false), onError: (e) => message.error(errorMessage(e)) });

  return (
    <div className="flex gap-3">
      <UserAvatar user={c.author} size={24} />
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2">
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span className="font-medium text-fg">{c.author?.full_name ?? 'Unknown'}</span>
          <Tooltip title={formatDateTime(c.created_at)}><span className="text-fg-3">{fromNow(c.created_at)}</span></Tooltip>
          {c.edited_at && <span className="text-fg-3">(edited)</span>}
          {c.author?.id === me.id && !editing && (
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

export const TaskComments = ({ taskId }: { taskId: number }) => {
  const me = useCurrentUser();
  const { message } = App.useApp();
  const query = useComments(taskId);
  const add = useAddComment();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    add.mutate({ taskId, text }, { onSuccess: () => setText(''), onError: (e) => message.error(errorMessage(e)) });
  };

  return (
    <div className="flex flex-col gap-4 pt-4">
      <QueryState query={query} isEmpty={(d) => !d.results.length} empty={<EmptyState description="No comments yet" />}>
        {(d) => <div className="flex flex-col gap-3">{d.results.map((c) => <CommentItem key={c.id} c={c} taskId={taskId} />)}</div>}
      </QueryState>
      <div className="flex gap-3">
        <UserAvatar user={me} size={24} />
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
