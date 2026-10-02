import { Grid } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { TaskDrawer } from '@/modules/tasks';
import { cn } from '@/shared/utils';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

/** App shell: top bar, sidebar, inset content panel. */
export const MainLayout = () => {
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (screens.xl === false) setCollapsed(true);
    if (screens.xl) setCollapsed(false);
  }, [screens.xl]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <Header collapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
      <div className="flex min-h-0 flex-1">
        <aside className={cn('shrink-0 transition-all', collapsed ? 'w-14' : 'w-60')}>
          <Sidebar collapsed={collapsed} />
        </aside>
        <main className="mr-2 mb-2 min-w-0 flex-1 overflow-auto rounded-xl border border-line bg-panel">
          <Outlet />
        </main>
      </div>
      <TaskDrawer />
    </div>
  );
};
