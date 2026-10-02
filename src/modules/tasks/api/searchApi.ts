import { actor, db, mockRequest, visibleProjectIds } from '@/shared/lib/mock';
import { PRIORITY, TASK_STATUS } from '@/shared/constants';

import type { SearchResults, TaskMatchField } from '../types/task.types';

const EMPTY: SearchResults = { tasks: [], projects: [], sprints: [], users: [], teams: [], comments: [] };

const norm = (s: string | null | undefined) => (s ?? '').toLowerCase();

/** Every query token must appear somewhere in the haystack. */
const matchesAll = (tokens: string[], haystack: string) => tokens.every((t) => haystack.includes(t));

/** Relevance of `text` (a primary field) for the query: exact > prefix > word prefix > substring. */
const fieldScore = (q: string, tokens: string[], text: string) => {
  const t = norm(text);
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 60;
  if (t.includes(q)) return 40;
  const words = t.split(/[\s\-_/.]+/);
  return tokens.reduce((s, tok) => s + (words.some((w) => w.startsWith(tok)) ? 8 : t.includes(tok) ? 4 : 0), 0);
};

/** ~90-char excerpt around the first matching token. */
const snippet = (text: string, tokens: string[]) => {
  const lower = norm(text);
  const at = Math.min(...tokens.map((t) => lower.indexOf(t)).filter((i) => i >= 0));
  if (!Number.isFinite(at)) return text.slice(0, 90);
  const start = Math.max(0, at - 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 90).trim()}${start + 90 < text.length ? '…' : ''}`;
};

const top = <T,>(items: { item: T; score: number }[], n: number) =>
  items.sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.item);

// GET /api/search?q=  — tasks, projects, sprints, people, teams and comments the actor can see.
// Empty query returns the actor's recently updated tasks.
export const globalSearch = (query: string) =>
  mockRequest<SearchResults>(() => {
    const me = actor();
    const visible = visibleProjectIds(me);
    const q = norm(query.trim()).replace(/\s+/g, ' ');
    const userName = (id: string | null) => db.users.find((u) => u.id === id)?.fullName ?? '';
    const projectOf = (id: string) => db.projects.find((p) => p.id === id);

    const visibleTasks = db.tasks.filter((t) => visible.has(t.projectId));
    const toTaskHit = (t: (typeof db.tasks)[number], match: SearchResults['tasks'][number]['match']) => ({
      id: t.id, key: t.key, title: t.title, status: t.status, priority: t.priority,
      projectKey: projectOf(t.projectId)?.key ?? '', assigneeId: t.assigneeId, match,
    });

    if (!q) {
      const recent = visibleTasks
        .filter((t) => t.assigneeId === me.id && t.status !== 'DONE' && t.status !== 'CANCELLED')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5)
        .map((t) => toTaskHit(t, null));
      return { ...EMPTY, tasks: recent };
    }

    const tokens = q.split(' ');

    const tasks = top(visibleTasks.flatMap((t) => {
      const project = projectOf(t.projectId);
      const fields: [TaskMatchField, string][] = [
        ['description', t.description],
        ['label', t.labels.join(' ')],
        ['assignee', userName(t.assigneeId)],
        ['project', `${project?.name ?? ''} ${project?.key ?? ''}`],
        ['status', TASK_STATUS[t.status].label],
        ['priority', PRIORITY[t.priority].label],
      ];
      const haystack = norm([t.key, t.title, ...fields.map(([, v]) => v), t.type].join(' '));
      if (!matchesAll(tokens, haystack)) return [];
      const primary = Math.max(fieldScore(q, tokens, t.key) * 1.5, fieldScore(q, tokens, t.title));
      // Explain non-obvious hits ("matched in description: …").
      const inPrimary = matchesAll(tokens, norm(`${t.key} ${t.title}`));
      const hint = inPrimary ? null : fields.find(([, v]) => tokens.some((tok) => norm(v).includes(tok)));
      const match = hint ? { field: hint[0], snippet: hint[0] === 'description' ? snippet(hint[1], tokens) : hint[1] } : null;
      const openBonus = t.status === 'DONE' || t.status === 'CANCELLED' ? 0 : 3;
      return [{ item: toTaskHit(t, match), score: primary + (inPrimary ? 20 : 0) + openBonus }];
    }), 8);

    const projects = top(db.projects.filter((p) => visible.has(p.id)).flatMap((p) => {
      if (!matchesAll(tokens, norm(`${p.name} ${p.key} ${p.description}`))) return [];
      const score = Math.max(fieldScore(q, tokens, p.name), fieldScore(q, tokens, p.key) * 1.5, 1);
      return [{ item: { id: p.id, key: p.key, name: p.name, status: p.status, description: p.description }, score }];
    }), 5);

    const sprints = top(db.sprints.filter((s) => visible.has(s.projectId)).flatMap((s) => {
      const project = projectOf(s.projectId);
      if (!matchesAll(tokens, norm(`${s.name} ${s.goal} ${project?.name} ${project?.key}`))) return [];
      return [{
        item: { id: s.id, name: s.name, goal: s.goal, status: s.status, projectKey: project?.key ?? '', projectName: project?.name ?? '' },
        score: Math.max(fieldScore(q, tokens, s.name), 1) + (s.status === 'ACTIVE' ? 5 : 0),
      }];
    }), 5);

    const users = top(db.users.flatMap((u) => {
      if (!matchesAll(tokens, norm(`${u.fullName} ${u.username} ${u.email} ${u.position}`))) return [];
      const score = Math.max(fieldScore(q, tokens, u.fullName), fieldScore(q, tokens, u.username), 1);
      return [{ item: { id: u.id, fullName: u.fullName, username: u.username, position: u.position, email: u.email }, score }];
    }), 5);

    const teams = top(db.teams.flatMap((t) => {
      if (!matchesAll(tokens, norm(t.name))) return [];
      return [{ item: { id: t.id, name: t.name, memberCount: t.memberIds.length, leadId: t.leadId }, score: fieldScore(q, tokens, t.name) }];
    }), 4);

    const comments = top(db.taskComments.flatMap((c) => {
      const task = db.tasks.find((t) => t.id === c.taskId);
      if (!task || !visible.has(task.projectId) || !matchesAll(tokens, norm(c.text))) return [];
      return [{
        item: { id: c.id, taskKey: task.key, taskTitle: task.title, authorId: c.authorId, snippet: snippet(c.text, tokens) },
        score: Date.parse(c.createdAt) / 1e12,
      }];
    }), 4);

    return { tasks, projects, sprints, users, teams, comments };
  }, 120);
