import { create } from 'zustand';

const DEMO_KEY = 'pm.demo';

/**
 * Mock server availability: dev builds, or a build with VITE_MOCK_FALLBACK=true (staging demos).
 * In production it's off — a missing endpoint shows a real error instead of fake data.
 */
export const MOCK_ENABLED = import.meta.env.DEV || import.meta.env.VITE_MOCK_FALLBACK === 'true';

const readDemo = () => {
  if (!MOCK_ENABLED) return false;
  try {
    return localStorage.getItem(DEMO_KEY) === 'true';
  } catch {
    return false;
  }
};

interface DemoState {
  /** On — every request is answered by the in-memory mock server (shared/lib/mockServer); no API calls. */
  enabled: boolean;
  /** Some request fell back to mock data because the backend was unreachable or lacks the endpoint. */
  fallback: boolean;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  markFallback: () => void;
}

/** Demo-data switch (header + login page), remembered per browser. */
export const useDemoMode = create<DemoState>((set, get) => ({
  enabled: readDemo(),
  fallback: false,
  toggle: () => get().setEnabled(!get().enabled),
  setEnabled: (enabled) => {
    try {
      localStorage.setItem(DEMO_KEY, String(enabled));
    } catch {
      // storage unavailable — the switch still works for this tab
    }
    set({ enabled });
  },
  markFallback: () => !get().fallback && set({ fallback: true }),
}));
