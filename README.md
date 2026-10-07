# U-management

Project & task management web app — projects, sprints, a Kanban board, daily reports and Telegram notifications,
with role-based access for the whole team.

> **Status:** every module talks to the real backend (`VITE_API_URL`, spec in [`api/api.json`](api/api.json)).
> Endpoints and fields the UI needs but the backend doesn't have yet are listed in
> [`docs/BACKEND_REQUIREMENTS.md`](docs/BACKEND_REQUIREMENTS.md).

---

## Contents

- [Quick start](#quick-start)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture rules](#architecture-rules)
- [Backend integration](#backend-integration)
- [Theming & styling](#theming--styling)
- [Environment variables](#environment-variables)
- [Scripts & quality gates](#scripts--quality-gates)
- [Known limitations](#known-limitations)

---

## Quick start

Requirements: **Node.js 20.19+ or 22.12+** (required by Vite 8), npm.

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend
npm run dev            # http://localhost:5173
```

Log in with an account that exists on the backend. Each role sees a different app: menu items, pages and actions are
filtered by permission. `SUPER_ADMIN` / `ADMIN` see all projects; other roles only see projects they are members of.

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
│   ├── lib             axios, react-query, dayjs, session & theme stores
│   ├── types           Domain entities
│   └── utils           Dates, validation, task rules
└── styles/       global.css (layers, component classes), variables.css (color palette)
```

Every module has the same shape and exposes a single public API through its `index.ts`:

```
modules/<name>/
├── api/         Request functions — one per backend endpoint
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

## Backend integration

- **Shapes as-is.** Responses are used exactly as the backend returns them (snake_case, numeric ids, lowercase enums,
  embedded `UserBrief`) — no mapping layer. Types live in [`src/shared/types/entities.ts`](src/shared/types/entities.ts);
  fields marked `NOT IN api.json` are requested from the backend.
- **Server-side everything.** Filters, search, sorting and pagination are query params (`?status=…&ordering=-created_at`);
  the UI never filters or sorts lists itself. Sortable `DataTable` columns (`sorter: true`) write `?ordering=` to the URL.
  Multi-value filters are sent as repeated keys (`status=todo&status=review`).
- **Edit = fresh copy.** Edit dialogs load the entity by id/key (`GET /users/:id/`, `/projects/:key/`, `/sprints/:id/`…).
- **Auth.** `POST /auth/login/` → JWT in cookies (`pm.access`, `pm.refresh`), `GET /auth/me/` in `localStorage` (`pm.user`);
  any 401 triggers one shared `POST /auth/refresh/`, logout blacklists the refresh token.
- **Errors.** `{ error: { status_code, detail } }` is turned into an `ApiError` with a readable message by the axios interceptor.

### Demo data (mock server)

[`src/shared/lib/mockServer`](src/shared/lib/mockServer) is an in-memory backend with the same endpoints and response
shapes (filters, search, ordering, pagination, workflow rules, activity). An axios adapter decides per request:

| Situation | Data source |
| --------- | ----------- |
| **Demo data ON** — the database button in the header, or the switch on the login page | Mock only, no network |
| Logged in through the mock (token starts with `mock.`) | Mock |
| Backend unreachable | That request falls back to mock (orange dot on the header button) |
| Endpoint not in `api.json` yet (dashboard, notifications, audit log, settings…) returns 404/405/501 | Mock |
| Everything else | Real backend |

Mock users: `superadmin`, `admin`, `bekzod` (PM), `akmal` (Team Lead), `shohrux` (Employee) — password `123456`.
Mock data resets on page reload.

What the backend still has to add (fields, filters, ordering fields, missing endpoints) is listed per tag in
[`docs/BACKEND_REQUIREMENTS.md`](docs/BACKEND_REQUIREMENTS.md).

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
| `VITE_API_URL`           | `/api`  | Backend base URL, e.g. `http://192.168.1.151:8000/api/v1`. Required for login.               |

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

- Dashboard, notifications, audit log, settings, comment editing, blocker history and project activity are not in `api.json` yet — they run on the mock server until the backend adds them (see `docs/BACKEND_REQUIREMENTS.md`).
- No automated tests yet.
- UI copy is English only (antd locale `en_US`).

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml`:

- **Pull request** (`main`, `dev`) va har push: `npm ci` → `npm run lint` → `npm run build`.
- **Push to `main`**: build artefakti serverga `rsync` qilinadi (`https://u-management.ziyodev.uz`), so'ng smoke check (`GET /` → 200).

Repo **Settings → Secrets and variables → Actions** da kerak:

| Secret | Qiymat |
|---|---|
| `DEPLOY_HOST` | server IP yoki domen |
| `DEPLOY_USER` | SSH foydalanuvchi (masalan `ubuntu`) |
| `DEPLOY_PATH` | nginx root, masalan `/var/www/u-management-frontend` |
| `DEPLOY_SSH_KEY` | faqat deploy uchun ajratilgan private key (ed25519), pub qismi serverdagi `~/.ssh/authorized_keys` da |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -t ed25519 <host>` natijasi |

Ixtiyoriy variable: `VITE_API_URL` (default `https://u-management-api.ziyodev.uz/api/v1`).
