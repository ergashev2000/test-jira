# U-management

Project & task management web app — projects, sprints, a Kanban board, daily reports and Telegram notifications,
with role-based access for the whole team.

> **Status: frontend MVP.** The backend is not ready yet, so the app runs on an in-memory **mock API** that
> enforces the same business rules a real server would. Data resets on every page reload.

---

## Contents

- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture rules](#architecture-rules)
- [Mock API & connecting a real backend](#mock-api--connecting-a-real-backend)
- [Theming & styling](#theming--styling)
- [Environment variables](#environment-variables)
- [Scripts & quality gates](#scripts--quality-gates)
- [Known limitations](#known-limitations)

---

## Quick start

Requirements: **Node.js 20.19+ or 22.12+** (required by Vite 8), npm.

```bash
npm install
cp .env.example .env   # optional — defaults work out of the box
npm run dev            # http://localhost:5173
```

Log in with any [demo account](#demo-accounts) — password **`123456`**.

## Demo accounts

Each role sees a different app: menu items, pages and actions are filtered by permission.

| Username     | Role            | Good for checking                                  |
| ------------ | --------------- | -------------------------------------------------- |
| `superadmin` | SUPER_ADMIN     | Everything, incl. settings and audit log           |
| `admin`      | ADMIN           | User / team management                             |
| `bekzod`     | PROJECT_MANAGER | Projects, sprints, approvals                       |
| `akmal`      | TEAM_LEAD       | Team workload, blockers, reviews                   |
| `shohrux`    | EMPLOYEE        | Daily work: my tasks, status changes, cancel requests |
| `otabek`     | EMPLOYEE        | **Inactive** account — login is rejected           |

## Features

| Area              | What it does                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| **Dashboard**     | KPIs (active projects/sprints, overdue, blocked), sprint progress, workload, active blockers     |
| **My tasks**      | Today / upcoming / overdue / blocked / completed tabs, daily plan confirmation                   |
| **Projects**      | Overview, board, backlog, sprints, members, reports and activity per project                     |
| **Sprints**       | Plan, start and complete sprints; unfinished tasks are carried over                              |
| **Board**         | Drag-and-drop Kanban (dnd-kit) with workflow rules on every move                                 |
| **Tasks**         | Detail drawer/page: comments, attachments, blockers, cancel requests, full activity history      |
| **Reports**       | Daily (per person / team) and project reports with charts                                        |
| **Notifications** | In-app inbox + per-event delivery settings; Telegram account linking                             |
| **Admin**         | Users, teams, company settings, audit log                                                        |
| **Search**        | `Ctrl/⌘ + K` command palette — tasks, projects, sprints, people, teams, comments, pages          |
| **Themes**        | Light and dark mode, remembered per browser                                                      |

## Tech stack

| Concern       | Choice                                                             |
| ------------- | ------------------------------------------------------------------ |
| UI            | React 19, TypeScript (strict)                                      |
| Build         | Vite 8                                                             |
| Components    | Ant Design 5 (themed via tokens)                                   |
| Styling       | Tailwind CSS 4 (layered above antd)                                |
| Server state  | TanStack Query 5                                                   |
| Client state  | Zustand 5 (session, theme)                                         |
| Routing       | React Router 6                                                     |
| Other         | dnd-kit (board), Recharts (charts), framer-motion (animation), Hugeicons, dayjs |
| Tooling       | oxlint (+ custom boundaries rule), Prettier, Husky + lint-staged   |

## Project structure

```
src/
├── app/          App bootstrap: providers, antd theme, router, route guards
├── layouts/      App shell — MainLayout, Header, Sidebar, search palette, navigation config
├── modules/      Feature modules (one folder per business domain)
│   ├── auth  dashboard  projects  sprints  tasks  board
│   └── users  teams  reports  notifications  audit-log  settings  profile
├── shared/       Code used by 2+ modules
│   ├── components/ui   Reusable UI (tags, icons, avatars, filters, loaders, KPI cards…)
│   ├── constants       ROUTES, PERMISSIONS, QUERY_KEYS, statuses, priorities, roles
│   ├── hooks           useTableParams (URL ⇄ filters), useDebounce, usePermission
│   ├── lib             axios, react-query, dayjs, session & theme stores, mock/
│   ├── types           Domain entities
│   └── utils           Dates, validation, task rules
└── styles/       global.css (layers, component classes), variables.css (color palette)
```

Every module has the same shape and exposes a single public API through its `index.ts`:

```
modules/<name>/
├── api/         Request functions (currently backed by the mock API)
├── hooks/       TanStack Query hooks (queries + mutations, cache invalidation)
├── components/  Module-only UI
├── pages/       Route components
├── types/       Module types
└── index.ts     Public exports — other code imports only from here
```

## Architecture rules

1. **Modules are independent.** A module imports only from itself, `shared/` and npm packages.
   Code needed by two or more modules moves to `shared/`.
2. **`shared/` never imports from `modules/`.** It must stay reusable.
3. **`app/` and `layouts/` compose modules.** They are the only places allowed to wire modules together.
4. **Server data lives in TanStack Query**, never copied into Zustand. Zustand only holds client state
   (session token, theme).
5. **Filters, tabs and pagination live in the URL** (`useTableParams`) so reloads and shared links restore the view.
6. **Permissions are checked twice** — in the UI (`hasPermission`, route guards, `<Can>`) and in the API layer.

Rules 1–2 are enforced by a custom oxlint rule, [`lint/boundaries-plugin.js`](lint/boundaries-plugin.js). It reports
violations as **warnings**: they are visible in the editor and in `npm run lint`, but do not block commits.

## Mock API & connecting a real backend

All data comes from [`src/shared/lib/mock`](src/shared/lib/mock):

- `mockDb.ts` — in-memory database, deep-copied from the seed data in `mock/data/` on load.
- `mockRequest(fn, delay)` — wraps a handler in a Promise with network-like latency and typed `ApiError`s
  (`401 / 403 / 404 / 422`).
- `session.ts` — resolves the current user and checks project access, like server-side auth would.

The mock behaves like a backend, not like a fixture: role checks, workflow rules, a review step before *Done*, one active
sprint per project, archived projects, inactive users, required blocker/cancel reasons… Every mutation also writes task
activity, an audit-log entry and notifications.

**Switching to a real API.** Request functions in `modules/*/api` are annotated with the endpoint they stand for
(e.g. `// GET /api/search?q=`). To connect the backend, replace the `mockRequest(...)` body with a call to the shared
axios client (`http` from `shared/lib/axios`). Hooks, pages and components do not change.

## Theming & styling

- **One palette, two modes.** Colors are CSS variables in [`variables.css`](src/styles/variables.css):
  dark by default, light under `<html data-theme="light">`. Tailwind exposes them as `bg-panel`, `text-fg-2`,
  `border-line`, …; the antd theme in [`app/theme.ts`](src/app/theme.ts) mirrors the same values.
- **Theme state** lives in `shared/lib/theme.ts` (Zustand, persisted to `localStorage`, defaults to the OS setting).
- **Layer order:** `theme → base → antd → components → utilities`. Tailwind utilities always win over antd styles,
  so prefer utilities over `!important`.
- **Use tokens, not hex.** Write `var(--c-primary)` / `text-danger` instead of hard-coded colors so both themes work.

| Token          | Value                                     |
| -------------- | ----------------------------------------- |
| Primary        | `#165DFF`                                 |
| Radius         | 8px controls · 6px small · 12px cards/modals |
| Control height | 32px (inputs) · 34px (buttons)            |

## Environment variables

See [`.env.example`](.env.example).

| Variable                 | Default | Description                                                                                 |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| `VITE_API_URL`           | `/api`  | Base URL for the axios client (`shared/lib/axios`).                                         |
| `VITE_USE_MOCK`          | `true`  | Reserved for the backend switch. **Not wired yet** — API functions always use the mock.     |
| `VITE_MOCK_TELEGRAM_SIM` | `true`  | Dev only: every 45 s moves one of `shohrux`'s tasks forward, as if done via the Telegram bot. |

## Scripts & quality gates

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the dev server with HMR                 |
| `npm run build`   | Type-check (`tsc -b`) and build to `dist/`    |
| `npm run preview` | Serve the production build locally            |
| `npm run lint`    | Run oxlint on the whole project               |

A **pre-commit hook** (Husky + lint-staged) runs oxlint on staged `*.ts(x)` / `*.js(x)` files. Lint errors block the
commit; warnings do not.

## Known limitations

- No real backend yet — data is lost on reload.
- `VITE_USE_MOCK` has no effect until the API layer is switched (see above).
- No automated tests yet.
- UI copy is English only (antd locale `en_US`).
