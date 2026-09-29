import type { ReactNode } from 'react';

export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="7" fill="#5e6ad2" />
    <path d="M8 14.5 12 18.5 20 10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Centered card layout for login / forgot / reset. */
export const AuthLayout = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(94,106,210,0.16),transparent_60%)]" />
    <div className="relative w-full max-w-[380px]">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Logo size={40} />
        <div>
          <h1 className="m-0 text-xl font-semibold text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 mb-0 text-fg-2">{subtitle}</p>}
        </div>
      </div>
      <div className="rounded-xl border border-line bg-panel p-6 shadow-2xl shadow-black/40">{children}</div>
    </div>
  </div>
);
