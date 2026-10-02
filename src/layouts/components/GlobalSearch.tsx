import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { useEffect, useState } from 'react';

import { SearchPalette } from './SearchPalette';

/** Header search trigger; click or Ctrl/⌘+K opens the command palette. */
export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-140 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 text-left text-[13px] text-fg-3 transition-colors hover:border-line-strong hover:text-fg-2"
      >
        <HugeiconsIcon icon={Search01Icon} size={16} className="hicon" strokeWidth={1.7} />
        <span className="flex-1 truncate">Search tasks, projects, people…</span>
        <kbd className="rounded border border-line px-1 font-sans text-[10px] text-fg-3">Ctrl K</kbd>
      </button>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
};
