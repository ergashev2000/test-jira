# Tasker — Project & Task Management (Frontend MVP)

Linear-style dark UI. React 19 + Vite + TypeScript (strict), Ant Design v5, Tailwind CSS v4, Zustand, TanStack Query, dnd-kit, Recharts, Hugeicons.
Backend is not ready yet — everything runs on an in-memory **mock API** (`src/shared/lib/mock`). Data resets on page reload.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Demo accounts (password `123456`)

| Username   | Role                         |
| ---------- | ---------------------------- |
| superadmin | SUPER_ADMIN                  |
| admin      | ADMIN                        |
| bekzod     | PROJECT_MANAGER              |
| akmal      | TEAM_LEAD                    |
| shohrux    | EMPLOYEE                     |
| otabek     | EMPLOYEE (INACTIVE — blocked) |

## Env

| Var                      | Default | Meaning                                                                 |
| ------------------------ | ------- | ----------------------------------------------------------------------- |
| `VITE_USE_MOCK`          | `true`  | Mock API layer. Real backend: switch `modules/*/api` to `shared/lib/axios`. |
| `VITE_API_URL`           | `/api`  | Real API base URL.                                                       |
| `VITE_MOCK_TELEGRAM_SIM` | `true`  | Dev only: every 45s advances one of shohrux's tasks with `source: TELEGRAM`. |

## Structure

```
src/
  app/        App, AppProvider (QueryClient, antd theme, App context), router, guards
  modules/    auth · dashboard · projects · sprints · tasks · board · users · teams
              reports · notifications · audit-log · settings · profile
              (each: api/ hooks/ components/ pages/ types/ index.ts — import other modules only via index)
  shared/     components/ui (StatusTag, PriorityTag, UserSelect, ReasonModal, FilterBar, Icon…),
              components/layout, hooks, utils, constants (ROUTES, PERMISSIONS, QUERY_KEYS…),
              lib (axios, react-query, dayjs, session store, mock/)
  styles/     global.css (Tailwind layers above antd), variables.css (palette)
```

Business rules (RBAC, review-before-done, one active sprint, archived project, inactive users, blocker/cancel reasons…)
are enforced both in the UI and inside the mock API (`ApiError 403/422`). Every mutation writes task activity,
an audit log entry and notifications, like a backend would.
