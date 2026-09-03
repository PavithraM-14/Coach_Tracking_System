# CTS — Coach Tracking System

Current phase: Login, Admin, Shell Production, Shell Outturn, Furnish In, Paint In.
React + PHP + MySQL, seeded from cleaned legacy reference data. See
`.claude/plans/` in this session's history for the full design rationale.

## Stack

- `frontend/` — React + TypeScript + Vite + Tailwind CSS, `react-day-picker` for
  calendar date entry, `react-router-dom` for routing.
- `backend/` — Plain PHP (no framework), PDO + prepared statements, hand-rolled
  JWT-shaped bearer-token auth.
- `database/` — `schema.sql` (all tables) and `seed.sql` (reference/master data
  only — transactional tables start empty).

## Local setup (XAMPP already installed)

1. Start **MySQL** from the XAMPP Control Panel (Apache is not needed).
2. Import the database (only needed once, or after wiping it):
   ```
   C:\xampp\mysql\bin\mysql.exe -u root < database/schema.sql
   C:\xampp\mysql\bin\mysql.exe -u root < database/seed.sql
   ```
3. Start the backend:
   ```
   C:\xampp\php\php.exe -S localhost:8000 -t backend
   ```
4. Start the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
5. Open http://localhost:5173.

## Demo accounts

Every role from the functional doc has its own login (13 total). All share
the password `Passw0rd!`.

| Username    | Role                          | Has working pages this phase? |
|-------------|-------------------------------|--------------------------------|
| admin1      | ADMIN                         | Yes — Production Orders, User Management, Line Management (read-only) |
| planning1   | PRODUCTION_PLANNING           | Login only |
| shell1      | SHELL_PRODUCTION              | Yes — Shell Production, Shell Outturn |
| furnish1    | FURNISHING                    | Yes — Furnishing In / Out (skills: LHB AC + Non-AC) |
| furnish2    | FURNISHING                    | Yes — Furnishing In / Out (skill: LHB AC only) |
| paint1      | PAINT                         | Yes — Line Management, full allocation (skills: LHB AC + Non-AC) |
| paint2      | PAINT                         | Yes — Line Management, full allocation (skill: LHB AC only) |
| assy1       | ASSEMBLY_PRODUCTION           | Login only |
| mechinsp1   | MECHANICAL_INSPECTION         | Login only |
| elecinsp1   | ELECTRICAL_INSPECTION         | Login only |
| shunt1      | SHUNTING_STAFF                | Login only |
| vendor1     | VENDOR_SNI                    | Login only |
| finalinsp1  | FINAL_INSPECTION              | Login only |
| dispatch1   | OUTTURN_DISPATCH              | Login only |
| viewer1     | MANAGEMENT_VIEWER             | Login only |

Roles without a page yet can log in (so accounts exist ahead of their
modules), but have nothing role-specific to do until those modules are built.

## Role scoping (strict)

Each role's sidebar shows only its own modules — nothing is shared by
default. `frontend/src/components/layout/AppShell.tsx`'s `NAV_ITEMS` is the
single allow-list; `App.tsx` wraps each route in a matching `ProtectedRoute
allowedRoles=[...]`, and the backend independently enforces the same via
`Auth::requireRole([...])` on every endpoint (defense in depth — a hidden nav
link is not the only thing stopping access).

- **Admin**: **Production Orders** (`/admin/production-orders` — BO creation,
  generates coaches for the serial range) and **User Management**
  (`/admin/users`) are separate sidebar items/pages now, not tabs on one
  page. Admin explicitly does **not** have Shell Outturn access, and can only
  *view* Line Management occupancy (no allocation).
- **Shell Production**: Shell Production worklist + Shell Outturn entry only.
- **Furnishing**: Furnishing In / Out only.
- **Paint**: Line Management (full allocation) only.
- Logging in as a role with no page yet lands on a Dashboard that says so —
  no dead nav links.

## Layout

`AppShell` uses a fixed sidebar + header: the outer shell is `h-screen
overflow-hidden`, only `<main>` scrolls (`overflow-y-auto`) — the sidebar and
header never move, at any scroll position. The sidebar has a hamburger toggle
(top-left of the header) that hides/shows it entirely (`w-60` ↔ `w-0`
transition) — the toggle stays in the header so it's reachable either way.
Sidebar branding: "INDIAN RAILWAYS" caption + a larger "CTS" wordmark at top;
**My Profile** (view own details + change password) and **Log out** are
always present regardless of role — Profile at the top nav (next to
Dashboard), Log out pinned to the bottom of the sidebar under the current
user's name.

**Line Management** (`/line-management`, renamed from "Paint In") now shows
**10 lines × 10 slots = 100 total capacity** (was 4 lines), with a 3-state
legend: green = available, orange = occupied (a coach is physically in that
slot), amber "Booked" = a coach is assigned to a Paint employee (via the
skill queue) but not yet placed in a specific slot — shown as a count badge
(`booked_count` from `paint-in/lines.php`), not a per-slot state, since
assignment isn't slot-specific. It also has **Paint Out Lines** and
**Assembly In Lines** tabs — explicit "not built yet" placeholders, not faked
functionality, since those modules don't exist yet.

The Dashboard (`HomePage`) no longer shows the "Welcome, name / ROLE" text
block (redundant with the header). Admin's stat grid grew from 3 to 7 tiles
(added Pending Shell Outturn, Awaiting Furnishing Out, Awaiting Paint In,
Queued for Assignment — all system-wide via `admin/dashboard_stats.php`,
computed with dedicated queries rather than reusing the role-gated worklist
endpoints) so the page isn't mostly empty space. **Recent Activity**
(`GET /api/dashboard/recent-activity.php`, limit bumped 10→30) now has a
filter box above it that searches coach number/type/performer/type client-side.

## Furnishing Out gates Paint In

A new `furnishing_out_transactions` table sits between Furnishing In and
Paint In. Shell Outturn still auto-opens Furnishing In (identical timestamp,
same as before), but a coach is only eligible for Paint In once the
Furnishing role explicitly records **Furnishing Out** for it
(`backend/api/furnishing-out/create.php`) — enforced both in the Paint In
worklist query and in `paint-in/create.php`'s validation (409 otherwise).

## Skill-based auto-assignment queue (Furnishing + Paint)

Implements the doc's `User -> Role -> Coach Type -> Skill` hierarchy, scoped
to the two modules where it matters right now:

- **`skills`** (admin master, `/admin/users`, per-role skill
  checkboxes) — one skill per (role, coach category), e.g. "LHB AC
  Furnishing". **`user_skills`** assigns them to employees, editable per user
  via "Edit Skills".
- **`coach_assignments`** (`backend/lib/Assignment.php`) tracks who owns the
  *next action* on a coach: for FURNISHING, who should record Furnishing Out;
  for PAINT, who should record Paint In. A coach becomes eligible the moment
  Furnishing In (→ FURNISHING assignment) or Furnishing Out (→ PAINT
  assignment) is recorded, and is auto-assigned to the least-loaded eligible,
  under-capacity employee — **max 5 concurrently ASSIGNED per employee per
  module** — or left `QUEUED` if everyone with that skill is full.
- Completing the action (Furnishing Out / Paint In submit) marks that
  assignment `COMPLETED` and immediately pulls the employee's oldest matching
  `QUEUED` coach into the freed slot — verified end-to-end via API tests
  (6 same-category coaches → 5 assigned + 1 queued → completing one
  auto-promotes the queued one).
- Furnishing In / Paint In worklists now show **only coaches assigned to the
  logged-in employee** (not the whole eligible pool), with a "Capacity: X/5
  assigned · Y queued" badge (`GET /api/assignments/my-summary.php`).
  `furnishing-out/create.php` and `paint-in/create.php` both reject (403) if
  the coach isn't currently assigned to the caller.
- Creating a user or editing their skills (`admin/users_create.php`,
  `admin/user_skills_update.php`) immediately runs a capacity-fill pass, so a
  newly skilled employee can pick up existing queued work right away.
- The Create User form only shows skill checkboxes when the selected role is
  Furnishing or Paint (a hint explains why for other roles) — if that's not
  showing, confirm the role dropdown actually has Furnishing/Paint selected.

## Profile (all roles)

`/profile` — available to every role via the sidebar, not gated by
`NAV_ITEMS`. Shows the user's own employee no./username/role/skills
(`GET /api/profile/me.php`) and a change-password form
(`POST /api/profile/change-password.php`, requires the current password,
verified with `password_verify` before the new one is hashed and stored).

## Admin: delete user

"Delete" on a user row (`admin/users_delete.php`) uses an inline
confirm/cancel (not `window.confirm` — unreliable across embedded browser
contexts and not stylable) and never destroys audit history: it checks
`recorded_by_user_id`/`assigned_user_id` across all four transaction tables
plus `coach_assignments`; a user with any history is **deactivated**
(`is_active = 0`, blocks login, kept for the historical record) rather than
deleted, and the response message says so explicitly. Only a user with zero
recorded history is actually `DELETE`d. Admin cannot delete their own
account (checked server-side). Verified both paths: a fresh no-history user
was hard-deleted; a user with a Shell Outturn on record was deactivated
instead, with the explanatory message surfaced in the UI.

## Security hardening

- **JWT secret**: no more hardcoded fallback string. `backend/config/config.php`
  generates a random 64-byte secret on first run and persists it to
  `backend/config/.jwt_secret` (0600 permissions) — set `CTS_JWT_SECRET` as a
  real env var for an actual deployment instead. Rotating the secret (e.g. by
  deleting that file) invalidates all outstanding tokens, forcing re-login.
- **Login timing**: `auth/login.php` always runs `password_verify()` — even
  for a username that doesn't exist, against a dummy bcrypt hash — so response
  timing can't be used to enumerate valid usernames.
- Every endpoint under `backend/api/` was scanned to confirm it calls either
  `Auth::requireRole([...])` or `Auth::currentUser()`; none are unauthenticated
  except `auth/login.php` itself.
- All queries remain PDO prepared statements with `PDO::ATTR_EMULATE_PREPARES
  => false` (native server-side prepares) — no string-concatenated SQL
  anywhere, including the newer Assignment/skills endpoints.

## Notes

- **Shell Outturn is date-only now** (no time picker) — `ShellOutturnEntryPage`
  sends a fixed `00:00` time to `shell-outturn/create.php`, which already
  tolerated a missing/invalid time by defaulting it. Furnishing In's date
  (mirrored from Shell Outturn) displays date-only too (`formatDateOnly` in
  `utils/dateFormat.ts`); Furnishing Out and Paint In still have real
  date+time entry since those weren't asked to change.
- `shell_to_furnishing_days` is always `0` in `fixed_schedules` — Shell Outturn
  and Furnishing In are the same event, enforced in
  `backend/api/shell-outturn/create.php` by writing both rows with the
  identical datetime in one DB transaction.
- Paint In slots are permanently occupied once used in this phase (no Paint
  Out yet — that's a future phase, stubbed as a placeholder tab in Line
  Management).
- Shell Outturn Entry (`/shell-outturn`) uses a BO dropdown → coach dropdown →
  calendar flow, mirroring the legacy CCTS Shell OT Entry screen's shape but
  with a real calendar picker instead of date buttons. Shell Production
  (`/shell-production`) is a separate read-only worklist view.
- Admin can create new BOs (`/admin/production-orders`) — this generates
  `coaches` rows live for the entered serial range, the same way the seed
  data was generated, capped at 200 coaches per BO.
- The login page and dashboard use the official Indian Railways tricolour
  emblem (public domain, Wikimedia Commons) — `frontend/src/assets/indian-railways-logo.svg`.
  Visual design (button radius, card shape, layout rhythm) was cross-checked
  against the live `srm-approval.vercel.app` reference site's login page CSS.
- Access control is role-level (route/API gated by role code) plus, for
  Furnishing/Paint, per-employee assignment via the skill queue above.
  Coach-type/operation-stage-level filtering for other roles (Assembly,
  Inspection, etc.) is deferred until those modules exist.
- Out of scope for this phase: Assembly, Mechanical/Electrical Inspection,
  Shunting, Vendor/SNI, Final Inspection, Outturn/Dispatch, Paint Out, and
  full RBAC configuration screens.
