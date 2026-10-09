import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  CheckListIcon,
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  QuoteDownIcon,
  SourceCodeIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from '@hugeicons/core-free-icons';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Tooltip } from 'antd';
import DOMPurify from 'dompurify';
import { useEffect, useMemo } from 'react';

import { cn } from '@/shared/utils';

const isHtml = (v: string) => /<\/?[a-z][\s\S]*>/i.test(v);
const escape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Stored value → safe HTML. Older plain-text descriptions become paragraphs (line breaks kept). */
const toSafeHtml = (value: string | null | undefined) => {
  const v = value?.trim() ?? '';
  if (!v) return '';
  const html = isHtml(v) ? v : v.split(/\n{2,}/).map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('');
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'data-type', 'data-checked'] });
};

/** Editor HTML → stored value; an editor with only an empty paragraph saves as ''. */
const fromEditor = (editor: Editor) => (editor.isEmpty ? '' : editor.getHTML());

export const RichTextView = ({ value, className }: { value: string | null | undefined; className?: string }) => {
  const html = useMemo(() => toSafeHtml(value), [value]);
  return <div className={cn('rich-text rich-text-view', className)} dangerouslySetInnerHTML={{ __html: html }} />;
};

const ToolButton = ({ icon, label, active, disabled, onClick }: {
  icon: IconSvgElement; label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) => (
  <Tooltip title={label} mouseEnterDelay={0.4}>
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the selection in the editor while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40',
        active && 'bg-surface-3 text-primary',
      )}
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.8} />
    </button>
  </Tooltip>
);

const Divider = () => <span className="mx-1 h-4 w-px bg-line" />;

const Toolbar = ({ editor }: { editor: Editor }) => {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      code: e.isActive('codeBlock'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  const onLink = () => {
    if (s.link) return void chain().extendMarkRange('link').unsetLink().run();
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', prev ?? 'https://');
    if (!url || url === 'https://') return;
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    chain().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1">
      <ToolButton icon={TextBoldIcon} label="Bold (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()} />
      <ToolButton icon={TextItalicIcon} label="Italic (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolButton icon={TextUnderlineIcon} label="Underline (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolButton icon={TextStrikethroughIcon} label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()} />
      <Divider />
      <ToolButton icon={Heading02Icon} label="Heading" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolButton icon={Heading03Icon} label="Subheading" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolButton icon={LeftToRightListBulletIcon} label="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton icon={LeftToRightListNumberIcon} label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton icon={CheckListIcon} label="Checklist" active={s.task} onClick={() => chain().toggleTaskList().run()} />
      <Divider />
      <ToolButton icon={QuoteDownIcon} label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()} />
      <ToolButton icon={SourceCodeIcon} label="Code block" active={s.code} onClick={() => chain().toggleCodeBlock().run()} />
      <ToolButton icon={Link01Icon} label={s.link ? 'Remove link' : 'Link'} active={s.link} onClick={onLink} />
      <span className="ml-auto flex gap-0.5">
        <ToolButton icon={ArrowTurnBackwardIcon} label="Undo (Ctrl+Z)" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton icon={ArrowTurnForwardIcon} label="Redo (Ctrl+Shift+Z)" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
      </span>
    </div>
  );
};

interface EditorProps {
  value: string | null | undefined;
  placeholder?: string;
  saving?: boolean;
  onSave: (html: string) => void;
  onCancel: () => void;
}

const extensions = (placeholder: string) => [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder }),
];

/** Rich text editor with a toolbar and Save / Cancel. Ctrl+Enter saves, Esc cancels. */
export const RichTextEditor = ({ value, placeholder = 'Write something…', saving, onSave, onCancel }: EditorProps) => {
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: toSafeHtml(value),
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'rich-text min-h-32 max-h-[60vh] overflow-y-auto px-3 py-2 outline-none' },
      handleKeyDown: (_view, e) => {
        if (e.key === 'Escape') { onCancel(); return true; }
        return false;
      },
    },
  });

  if (!editor) return null;
  const save = () => onSave(fromEditor(editor));

  return (
    <div
      className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-primary"
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } }}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end gap-2 border-t border-line px-2 py-1.5">
        <span className="mr-auto text-[11px] text-fg-3">Ctrl+Enter to save · Esc to cancel</span>
        <Button size="small" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="small" type="primary" loading={saving} onClick={save}>Save</Button>
      </div>
    </div>
  );
};

/** Form-controlled rich text field (antd Form.Item `value` / `onChange`) — toolbar, no Save / Cancel. */
export const RichTextInput = ({ value, onChange, placeholder = 'Write something…', className }: {
  value?: string; onChange?: (html: string) => void; placeholder?: string; className?: string;
}) => {
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: toSafeHtml(value),
    editorProps: { attributes: { class: cn('rich-text min-h-28 max-h-[40vh] overflow-y-auto px-3 py-2 outline-none', className) } },
    onUpdate: ({ editor: e }) => onChange?.(fromEditor(e)),
  });

  // Value set from outside (form reset, "Create more") — load it unless it's what the editor already holds.
  useEffect(() => {
    if (editor && (value ?? '') !== fromEditor(editor)) editor.commands.setContent(toSafeHtml(value), { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface focus-within:border-primary">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
