import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'pm.theme';

const readMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // storage unavailable — fall back to system preference
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

/** Mirrors the mode onto <html> so CSS variables (styles/variables.css) switch palette. */
const applyMode = (mode: ThemeMode) => {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
};

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const initialMode = readMode();
applyMode(initialMode);

/** App-wide light/dark mode, persisted in localStorage. */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  setMode: (mode) => {
    applyMode(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // ignore — mode just won't persist
    }
    set({ mode });
  },
  toggle: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),
}));
