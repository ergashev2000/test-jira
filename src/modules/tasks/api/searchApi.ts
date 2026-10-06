import { api } from '@/shared/lib/axios';
import type { ApiPaginated, Project, Sprint, Task, Team } from '@/shared/types';

import type { SearchResults } from '../types/task.types';

const LIMIT = 5;

const list = async <T,>(url: string, search: string, extra: object = {}): Promise<T[]> => {
  const { data } = await api.get<ApiPaginated<T>>(url, { params: { search, page_size: LIMIT, ...extra } });
  return data.results;
};

/** A section the user can't access (e.g. /users/ for non-admins) is simply empty. */
const settled = <T,>(r: PromiseSettledResult<T[]>) => (r.status === 'fulfilled' ? r.value : []);

// GET /tasks|projects|sprints|users|teams/?search=  — each list endpoint searches on the backend.
// Empty query: the current user's recently updated open tasks (GET /me/tasks/?ordering=-updated_at).
export const globalSearch = async (query: string): Promise<SearchResults> => {
  const q = query.trim();
  if (!q) {
    const { data } = await api.get<ApiPaginated<Task>>('/me/tasks/', { params: { ordering: '-updated_at', page_size: LIMIT } });
    return { tasks: data.results, projects: [], sprints: [], users: [], teams: [] };
  }
  const [tasks, projects, sprints, users, teams] = await Promise.allSettled([
    list<Task>('/tasks/', q, { page_size: 8 }),
    list<Project>('/projects/', q),
    // GET /sprints/ ignores ?search= for now — match names here on the most recent sprints.
    list<Sprint>('/sprints/', q, { page_size: 100, ordering: '-start_date' })
      .then((rows) => rows.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, LIMIT)),
    list<SearchResults['users'][number]>('/users/', q),
    list<Team>('/teams/', q),
  ]);
  return { tasks: settled(tasks), projects: settled(projects), sprints: settled(sprints), users: settled(users), teams: settled(teams) };
};
