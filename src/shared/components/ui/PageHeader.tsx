import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import type { ReactNode } from 'react';

import { Link } from 'react-router-dom';

export interface Crumb {
  label: ReactNode;
  to?: string;
}

interface Props {
  title?: ReactNode;
  icon?: ReactNode;
  breadcrumb?: Crumb[];
  count?: number;
  extra?: ReactNode;
  children?: ReactNode;
}

/** Linear-style top bar of a page: breadcrumb/title left, actions right, optional sub-row. */
export const PageHeader = ({ title, icon, breadcrumb, count, extra, children }: Props) => (
  <div className="sticky top-0 z-10 border-b border-line bg-panel/95 backdrop-blur">
    <div className="flex min-h-12 flex-wrap items-center gap-3 px-5 py-2">
      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        {breadcrumb?.map((c, i) => (
          <span key={i} className="flex items-center gap-2 text-fg-2">
            {c.to ? (
              <Link to={c.to} className="!text-fg-2 hover:!text-fg">
                {c.label}
              </Link>
            ) : (
              c.label
            )}
            <HugeiconsIcon icon={ArrowRight01Icon} size={11} className="hicon text-fg-3" strokeWidth={1.7} />
          </span>
        ))}
        {icon}
        {title && <h1 className="m-0 truncate text-[13px] font-medium text-fg">{title}</h1>}
        {count !== undefined && (
          <span className="rounded-full bg-surface-2 px-1.5 text-[11px] leading-5 text-fg-2">{count}</span>
        )}
      </div>
      {extra && <div className="ml-auto flex flex-wrap items-center gap-2">{extra}</div>}
    </div>
    {children && <div className="border-t border-line px-5 py-2">{children}</div>}
  </div>
);
