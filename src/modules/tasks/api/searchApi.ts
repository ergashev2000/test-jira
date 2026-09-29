import { actor, db, mockRequest, visibleProjectIds } from '@/shared/lib/mock';

import type { SearchResults } from '../types/task.types';
import { toRow } from './helpers';

// GET /api/search?q=
export const globalSearch = (query: string) =>
  mockRequest<SearchResults>(() => {
    const me = actor();
    const q = query.trim().toLowerCase();
    if (!q) return { tasks: [], projects: [], users: [] };
    const visible = visibleProjectIds(me);
    return {
      tasks: db.tasks
        .filter((t) => visible.has(t.projectId))
        .filter((t) => t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q))
        .slice(0, 6)
        .map(toRow)
        .map(({ id, key, title, status, projectKey }) => ({ id, key, title, status, projectKey })),
      projects: db.projects
        .filter((p) => visible.has(p.id))
        .filter((p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
        .slice(0, 4)
        .map(({ id, key, name }) => ({ id, key, name })),
      users: db.users
        .filter((u) => u.fullName.toLowerCase().includes(q) || u.username.includes(q))
        .slice(0, 4)
        .map(({ id, fullName, username, position }) => ({ id, fullName, username, position })),
    };
  }, 200);
