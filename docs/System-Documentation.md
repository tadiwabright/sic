# Swimming Interhouse Competition Scoreboard (SICS)

Comprehensive documentation for the Swimming Interhouse Competition Scoreboard system. This document explains the system objectives, features, roles, architecture, data model, scoring logic, API surface, UI workflows, theming, real-time mechanisms, exports, setup, security, troubleshooting, and roadmap.

---

## 1) Objectives

- Provide a live, accurate scoreboard for interhouse swimming competitions.
- Enable authorized officials to manage houses, swimmers, events, and results efficiently.
- Calculate and display house totals based on defined scoring and tie rules.
- Offer a public view with live updates suitable for display on large screens.
- Support modern dark/light themes and consistent iconography.
- Facilitate exporting results for post-competition reporting.

---

## 2) Key Features

- Live scoreboard with house totals and detailed event results (`sics/components/enhanced-scoreboard.tsx`).
- Admin dashboard to manage all entities and workflows (`sics/components/admin-dashboard.tsx`).
- Role-based access (admin, official, viewer) via lightweight JWT sessions (`sics/lib/auth.ts`).
- Scoring and tie handling aligned with competition rules (`sics/lib/scoring.ts`, `sics/lib/db.ts`).
- Real-time feel via periodic refresh (30s) on public and admin scoreboards.
- Export results to CSV (`sics/app/api/export-results/route.ts`).
- Theming support (dark/light) with a global toggle and lucide icons.
- Schema bootstrap endpoint to initialize/repair DB tables (`sics/app/api/bootstrap-competition/route.ts`).

---

## 3) User Roles & Permissions

- Admin
  - Full access: manage houses, swimmers, events, results; view analytics; export data.
- Official
  - Manage swimmers, events, results; view dashboards and scoreboards.
- Viewer
  - Read-only access to public scoreboard.

Permission checks are enforced in API routes (e.g., `sics/app/api/swimmers/route.ts`) and by redirecting unauthorized users in pages like `sics/app/admin/page.tsx`.

---

## 4) System Architecture

- Framework: Next.js App Router (React) with TypeScript.
- UI: Shadcn UI components + Tailwind + lucide-react icons.
- Data: Postgres (Neon serverless) accessed via `@neondatabase/serverless`.
- Auth: JWT stored in `auth-token` cookie; special `admin-key` bypass cookie for local admin portal (`sics/lib/auth.ts`).
- API: REST-style Next.js route handlers under `sics/app/api/`.
- Theming: `next-themes` + custom components (`sics/components/theme-provider.tsx`, `sics/components/theme-toggle.tsx`).

---

## 5) Data Model

Tables created/maintained by `sics/app/api/bootstrap-competition/route.ts` (and some defensive creation in other routes):

- House (table: `houses`)
  - id SERIAL PK
  - name TEXT
  - color TEXT
  - created_at TIMESTAMPTZ

- Event (table: `events`)
  - id SERIAL PK
  - name, category, distance TEXT
  - gender TEXT (values: male, female, mixed)
  - age_group TEXT
  - max_participants_per_house INTEGER
  - is_active BOOLEAN
  - event_order INTEGER
  - created_at TIMESTAMPTZ

- Swimmer (table: `swimmers`)
  - id SERIAL PK
  - name TEXT
  - house_id INTEGER FK -> houses(id)
  - age_group TEXT
  - gender TEXT (male/female)
  - created_at TIMESTAMPTZ

- Result (table: `results`)
  - id SERIAL PK
  - event_id INTEGER FK -> events(id)
  - swimmer_id INTEGER FK -> swimmers(id)
  - time_seconds NUMERIC (nullable)
  - status TEXT (completed, disqualified, did_not_start, did_not_finish)
  - position INTEGER (nullable)
  - points INTEGER
  - created_at, updated_at TIMESTAMPTZ

Convenience SQL helpers and TypeScript interfaces are defined in `sics/lib/db.ts`.

---

## 6) Scoring Rules and Tie Handling

Reference rules (aligned with project requirements):

- Points by position
  - 1st = 4 points
  - 2nd = 3 points
  - 3rd = 2 points
  - 4th = 1 point
  - 5th–8th = 0 points
- Disqualified/DNS/DNF = 0 points
- Tie handling
  - Tied swimmers share the same position and points.
  - The next position is skipped accordingly (e.g., two 1st places -> next is 3rd).

Implementation locations:

- Utility scoring helpers: `sics/lib/scoring.ts` and `sics/lib/db.ts` (`calculatePoints`, `calculatePositionsAndPoints`, etc.).
- API layer computes/accepts results with assigned positions and points (`sics/app/api/results/route.ts`).

---

## 7) API Endpoints (summary)

All endpoints under `sics/app/api/`.

- Auth
  - `auth/login/` (POST): authenticate user; issues JWT cookie. See `sics/app/api/auth/login/`.
  - `auth/logout/` (POST): clear session. See `sics/app/api/auth/logout/`.
  - `auth/me/` (GET): current user info. See `sics/app/api/auth/me/`.
  - `auth/key/` and `auth/bootstrap/`: helpers for key-based admin access and seeding.

- Bootstrap
  - `bootstrap-competition/` (GET/POST): ensure DB schema exists.

- Houses (`sics/app/api/houses/route.ts`)
  - GET: list houses with swimmer counts and total points.
  - POST: create a new house (requires admin/official).

- Events (`sics/app/api/events/route.ts`, `sics/app/api/events/[id]/route.ts`)
  - GET: list events ordered by `event_order`.
  - POST: create event (admin/official).
  - PUT `[id]`: update event (admin/official).
  - DELETE `[id]`: delete event (admin/official).

- Swimmers (`sics/app/api/swimmers/route.ts`)
  - GET: list swimmers with house name/color.
  - POST: create swimmer (admin/official).
  - PUT: update swimmer (admin/official).
  - Defensive schema upgrades if columns are missing.

- Results (`sics/app/api/results/route.ts`)
  - GET: list results for a given `event_id`, joined with swimmer and house info.
  - POST: replace results for an event; inserts positions/points per swimmer.

- Participant view (`sics/app/api/participant-results/route.ts`)
  - GET: flat list of all result rows with swimmer, event, and house info for the public scoreboard.

- Exports (`sics/app/api/export-results/route.ts`)
  - GET: returns CSV export of results.

- Analytics & Reports
  - `sics/app/api/analytics/route.ts`: summary analytics for admin views.
  - `sics/app/api/reports/export/`: additional report output(s).

Note: Many GET endpoints use retry logic to be resilient to short-lived serverless hiccups.

---

## 8) UI & Workflows

- Public Scoreboard (`sics/app/scoreboard/page.tsx` -> `sics/components/enhanced-scoreboard.tsx`)
  - Displays house rankings with total points (ranked and color-coded).
  - Shows event results with positions, points, times, and statuses.
  - Refresh button and auto-refresh every 30 seconds for live updates.
  - Export button for CSV.
  - View modes: Table/Cards.

- Admin Portal (`sics/app/admin/page.tsx` -> `sics/components/admin-dashboard.tsx`)
  - Tabs: Dashboard, Houses, Events, Results Entry, Live Scoreboard, Swimmers.
  - Houses: create/manage houses and colors.
  - Events: configure event details, order, and activation.
  - Swimmers: add/edit swimmers (with age group and gender); house assignment.
  - Results Entry: enter times/statuses, compute positions/points, save.
  - Live Scoreboard: admin-oriented view of scores/standings.
  - Authenticated via JWT; unauthorized users redirected to `/login`.

- Results Page (`sics/app/results/page.tsx`)
  - Alternative view around results entry and summaries.

- Login (`sics/app/login/page.tsx` + `sics/components/login-form.tsx`)
  - Username/password authentication.

---

## 9) Theming & UX

- Global theme toggle (`sics/components/theme-toggle.tsx`) with dark/light modes via `next-themes`.
- Consistent lucide icons across the UI (e.g., `Trophy`, `Medal`, `Download`).
- Gradient headline styling components (`sics/components/GradientText.jsx`, `sics/components/ThemedGradientText.tsx`, CSS in `sics/components/GradientText.css`).
- Responsive layouts; large-screen friendly for public display.

---

## 10) Real-time Updates

- The scoreboard uses periodic polling every 30 seconds (see `useEffect` timers in `enhanced-scoreboard.tsx` and `live-scoreboard.tsx`).
- Manual refresh buttons are available for immediate updates.
- Future enhancement: consider WebSockets or Server-Sent Events for push updates.

---

## 11) Exporting

- CSV export endpoint: `GET /api/export-results`.
- Frontend trigger: Export button in `enhanced-scoreboard.tsx`.
- Filename includes date for convenient archiving.

---

## 12) Setup & Configuration

- Prerequisites
  - Node.js LTS.
  - Postgres (Neon serverless recommended). Create a database and obtain `DATABASE_URL`.

- Environment variables (`sics/.env.local`)
  - `DATABASE_URL` (required): connection string for Neon/Postgres.
  - `JWT_SECRET` (recommended): secret for JWT signing. Defaults to a development value if not provided.

- Install & Run
  - `npm install`
  - `npm run dev` (development)
  - Visit `http://localhost:3000`.

- Initialize database schema
  - `GET /api/bootstrap-competition` or `POST /api/bootstrap-competition` to create required tables/indexes.

---

## 13) Security Considerations

- Use strong `JWT_SECRET` in production.
- Ensure HTTPS in production deployments.
- Restrict admin/official endpoints to authorized users; review `getCurrentUser()` trust rules in `sics/lib/auth.ts`.
- The `admin-key` cookie path allows a bypass for local admin usage; disable or gate this for production.

---

## 14) Troubleshooting

- Database connection errors
  - Verify `DATABASE_URL` and database availability.
  - Use `/api/bootstrap-competition` to ensure schema and indexes exist.

- Missing columns / schema drift
  - Some routes (e.g., `swimmers`) attempt auto-repair (adding columns). Re-run bootstrap as needed.

- Scoreboard not updating
  - Check network requests to `/api/participant-results` and `/api/houses`.
  - Verify auto-refresh intervals are running (browser console for errors).

- TypeScript JSX error: "Cannot find namespace 'JSX'"
  - With React 19 and `@types/react@^19`, prefer `React.JSX.*` types. Example fix in `sics/components/ThemedGradientText.tsx`: `as?: keyof React.JSX.IntrinsicElements`.
  - Ensure `sics/tsconfig.json` includes `"lib": ["dom", "dom.iterable", "esnext"]` and `"jsx": "preserve"` (already present).

---

## 15) Roadmap Ideas

- Replace polling with real-time push (WebSockets/SSE) for instant updates.
- Role management UI for creating users and assigning roles.
- Advanced analytics and PDF export of reports.
- Offline entry mode and sync for poor connectivity venues.
- Accessibility improvements (ARIA, keyboard navigation).
- Internationalization for multi-language events.

---

## 16) Repository Structure (selected)

- `sics/app/`
  - `admin/`, `login/`, `results/`, `scoreboard/` pages
  - `api/` route handlers (auth, houses, swimmers, events, results, exports, analytics)
  - `layout.tsx`, `globals.css`
- `sics/components/`
  - Admin and public UI components, theming, gradient text, and Shadcn UI wrappers.
- `sics/lib/`
  - `db.ts`, `auth.ts`, `scoring.ts`, `utils.ts`
- `sics/docs/`
  - `System-Documentation.md` (this document)

---

## 17) How To Use (Quick Guide)

- Admin/Official
  1. Set `DATABASE_URL`, start dev server.
  2. Call `/api/bootstrap-competition` to ensure schema.
  3. Login via `/login`.
  4. Go to `/admin`.
  5. Create Houses -> Events -> Swimmers.
  6. Enter results in Results Entry; positions and points are computed/validated.
  7. Monitor `/scoreboard` for public live view; export CSV as needed.

- Viewer
  1. Navigate to `/scoreboard`.
  2. View live standings and detailed results; screen is auto-refreshing.

---

If you need changes to the documentation format or want additional diagrams (e.g., sequence or ER diagrams), let us know.
