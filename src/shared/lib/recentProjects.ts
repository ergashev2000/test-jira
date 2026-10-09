import { create } from 'zustand';

const KEY = 'pm.recent-projects';
const LIMIT = 5;

/** user id → project ids, most recent first. */
type RecentMap = Record<string, number[]>;

const read = (): RecentMap => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentMap) : {};
  } catch {
    return {};
  }
};

interface RecentProjectsState {
  byUser: RecentMap;
  /** Moves the project to the top of the user's list. */
  visit: (userId: number, projectId: number) => void;
}

/** Projects the user opened last — kept in this browser only, per user. */
export const useRecentProjectsStore = create<RecentProjectsState>((set, get) => ({
  byUser: read(),
  visit: (userId, projectId) => {
    const current = get().byUser[userId] ?? [];
    if (current[0] === projectId) return;
    const byUser = { ...get().byUser, [userId]: [projectId, ...current.filter((id) => id !== projectId)].slice(0, LIMIT) };
    try {
      localStorage.setItem(KEY, JSON.stringify(byUser));
    } catch {
      // ignore — the list just won't persist
    }
    set({ byUser });
  },
}));
