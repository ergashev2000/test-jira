import { create } from 'zustand';

/** `panel` — docked beside the page and squeezes it (default, handy on the board); `drawer` — wide overlay. */
export type TaskViewMode = 'panel' | 'drawer';

const KEY = 'pm.task-view';

const read = (): TaskViewMode => {
  try {
    return localStorage.getItem(KEY) === 'drawer' ? 'drawer' : 'panel';
  } catch {
    return 'panel';
  }
};

interface TaskViewModeState {
  mode: TaskViewMode;
  setMode: (mode: TaskViewMode) => void;
}

/** How a task opened with `?task=ID` is shown — remembered in this browser. */
export const useTaskViewMode = create<TaskViewModeState>((set) => ({
  mode: read(),
  setMode: (mode) => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      // ignore — the choice just won't persist
    }
    set({ mode });
  },
}));
