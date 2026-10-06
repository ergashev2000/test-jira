import { Input, Tooltip } from 'antd';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { cn } from '@/shared/utils';

interface Props {
  value: string;
  /** Called with the new value only when it actually changed. */
  onSave: (value: string) => void;
  /** Off — plain text, no double-click. */
  editable: boolean;
  multiline?: boolean;
  /** Empty value can't be saved (e.g. title). */
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** What's shown when not editing (defaults to the value). */
  children?: ReactNode;
}

/**
 * Text that turns into an input on double-click.
 * Enter (Ctrl/⌘+Enter when multiline) or clicking away saves, Esc cancels.
 */
export const InlineEdit = ({ value, onSave, editable, multiline, required, placeholder, className, inputClassName, children }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    const next = multiline ? draft.replace(/\s+$/, '') : draft.trim();
    setEditing(false);
    if ((required && !next) || next === value) return;
    onSave(next);
  };
  const cancel = () => setEditing(false);
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      cancel();
    }
    if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      commit();
    }
  };

  if (editing) {
    return multiline ? (
      <div className="flex flex-col gap-1">
        <Input.TextArea autoFocus value={draft} placeholder={placeholder} autoSize={{ minRows: 3, maxRows: 16 }} className={inputClassName}
          onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKeyDown}
          onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)} />
        <span className="text-[11px] text-fg-3">Ctrl+Enter to save · Esc to cancel</span>
      </div>
    ) : (
      <Input autoFocus value={draft} placeholder={placeholder} className={inputClassName}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKeyDown} />
    );
  }

  const content = children ?? (value || <span className="text-fg-3">{placeholder}</span>);
  if (!editable) return <div className={className}>{content}</div>;
  return (
    <Tooltip title="Double-click to edit" mouseEnterDelay={0.8}>
      <div className={cn('-mx-1.5 cursor-text rounded-md px-1.5 transition-colors hover:bg-surface-2', className)}
        onDoubleClick={start}>
        {content}
      </div>
    </Tooltip>
  );
};
