# CTS — Coach Tracking System

Current phase: Login, Admin, Shell Production, Shell Outturn, Furnish In,
Paint In, Paint Out, Assembly In, Assembly Out.
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

Every role from the functional doc has its own login (13 total), plus one
extra Paint login and one extra Assembly Production login (15 total) — one
per pipeline direction, per role. All share the password `Passw0rd!`.

| Username    | Role                          | Has working pages this phase? |
|-------------|-------------------------------|--------------------------------|
| admin1      | ADMIN                         | Yes — Production Orders, User Management, Line Management (read-only) |
| planning1   | PRODUCTION_PLANNING           | Login only |
| shell1      | SHELL_PRODUCTION              | Yes — Shell Production, Shell Outturn |
| furnish1    | FURNISHING                    | Yes — Furnishing In (skills: LHB AC + Non-AC) — the only Furnishing login; every coach past Shell Outturn is assigned to them, uncapped |
| paint1      | PAINT                         | Yes — Paint In (`/paint-in`, full allocation; matrix: Paint In, all coach types) |
| paint2      | PAINT                         | Yes — Paint Out (`/paint-out`, full allocation; matrix: Paint Out, all coach types) |
| assemble1   | ASSEMBLY_PRODUCTION           | Yes — Assembly In only (`/assembly-in`; skills: LHB AC + Non-AC Assembly In) |
| assemble2   | ASSEMBLY_PRODUCTION           | Yes — Assembly Out only (`/assembly-out`; skills: LHB AC + Non-AC Assembly Out) |
| mechinsp1   | MECHANICAL_INSPECTION         | Login only |
| elecinsp1   | ELECTRICAL_INSPECTION         | Login only |
| shunt1      | SHUNTING_STAFF                | Login only |
| vendor1     | VENDOR_SNI                    | Login only |
| finalinsp1  | FINAL_INSPECTION              | Login only |
| dispatch1   | OUTTURN_DISPATCH              | Login only |
| viewer1     | MANAGEMENT_VIEWER             | Login only |

Roles without a page yet can log in (so accounts exist ahead of their
modules), but have nothing role-specific to do until those modules are built.

`admin1` has `email` set (an inbox we control) so the Forgot Password flow has
something to test end-to-end; every other demo account has no email on file.

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
  *view* Line Management occupancy (no allocation, no `/paint-in` access).
- **Shell Production**: Shell Production worklist + Shell Outturn entry
  (`/shell-outturn`, multi-coach) + a read-only Shell Outturn Records history
  (`/shell-outturn/history`).
- **Furnishing**: Furnishing In entry (`/furnishing-in`) + a read-only
  Furnishing In Records history (`/furnishing-in/history`).
- **Paint**: **Paint In** (`/paint-in`) and **Paint Out** (`/paint-out`) —
  two separate entry pages, each with its own line/slot grid, worklist and
  history page (`/paint-in/history`, `/paint-out/history`, both shared
  read-only with Admin).
- **Assembly Production**: **Assembly In** (`/assembly-in`) and
  **Assembly Out** (`/assembly-out`) — same pattern as Paint, its own
  line/slot grid and history page per stage (`/assembly-in/history`,
  `/assembly-out/history`).
- Logging in as a role with no page yet lands on a Dashboard that says so —
  no dead nav links.

**Line Management** (`/line-management`) and **Paint In** (`/paint-in`) are
deliberately two separate pages/routes/nav items, not one component
branching on role — they used to be combined (a single page that either
showed Admin's read-only multi-tab overview or Paint's data-entry form
depending on `user.role`), but that made it too easy for a change meant for
one role to leak into the other. Now: Admin-only content lives only in
`LineManagementPage.tsx`, Paint's entry form lives only in `PaintInPage.tsx`,
and neither imports or branches into the other.

Each of the three stages (Shell Outturn, Furnishing In, Paint In) follows the
same **entry + history** split: the entry page is the worklist/submission
form for that role, and the history page is a read-only, searchable records
list with a "today only" filter (`?today=1`) that dashboard tiles link into
directly — a "Completed Today" tile that just linked to the entry page used
to show the wrong (unfiltered) count; it now links to
`.../history?today=1`.

## Layout

`AppShell` uses a fixed sidebar + header: the outer shell is `h-screen
overflow-hidden`, only `<main>` scrolls (`overflow-y-auto`) — the sidebar and
header never move, at any scroll position. The sidebar has a hamburger toggle
(top-left of the header) that hides/shows it entirely (`w-60` ↔ `w-0`
transition) — the toggle stays in the header so it's reachable either way.
Sidebar branding: "INDIAN RAILWAYS" caption + a larger "CTS" wordmark at top.
**My Profile** and **Log out** are always present regardless of role — Profile
sits at the *bottom* of the module list (after the role-specific items, with
a small round avatar icon next to it) and Log out is pinned to the very
bottom of the sidebar on its own, with no name/role text above it (removed —
that info is already in the header).

**Line Management** (`/line-management`, Admin-only) and **Paint In**
(`/paint-in`, Paint-only) used to be one shared component that branched on
`user.role` — Admin got a read-only view, Paint got the data-entry form. That
turned out to be the wrong call: a change meant for one role kept risking a
leak into the other. They're now two fully separate pages/files, each owning
only its own role's content:

- **`LineManagementPage.tsx`** (`/line-management`) is a pure read-only,
  4-tab overview for Admin: Paint In Lines, Paint Out Lines, Assembly In
  Lines, Assembly Out Lines — all four now live, each showing real
  occupancy via a shared generic `ReadOnlyLines` component (no entry form on
  any tab, since Admin can't allocate) — plus a row of four real "Records"
  links (`/paint-in/history`, `/paint-out/history`, `/assembly-in/history`,
  `/assembly-out/history`). Each stage shows **10 lines × 10 slots = 100
  total capacity** — Paint Out, Assembly In and Assembly Out each have their
  own independent line/slot pool (`paint_out_lines`, `assembly_in_lines`,
  `assembly_out_lines` + matching `*_line_slots` tables), structurally
  identical to Paint In's, not a shared/reused slot — a coach simply moves
  into the next stage's own pool. Went through a few names this session —
  "Line Management" → "Paint Line Allocation" → "Paint In Line Allocation" →
  back to **"Line Management"**, since the page's job is a multi-stage
  overview, not just Paint In.
- **`PaintInPage.tsx`** (`/paint-in`) is the Paint employee's own focused
  entry page: no tabs, no Admin content, and only one button — "Paint In
  Records →" (a real link to `/paint-in/history`, with no disabled
  placeholders for the other stages, since this page is scoped to exactly
  what a Paint employee does). Just their own assigned coaches, the
  line/slot grid, and the submission form. Paint In is date-only (no time
  picker — fixed `00:00`, same as Shell Outturn/Furnishing In).

Both pages share the same legend (green "Available", amber "Booked" — a
coach assigned to a Paint employee via the assignment queue but not yet
placed in a specific slot, shown as a count badge from `paint-in/lines.php`'s
`booked_count`, not a per-slot state, since assignment isn't slot-specific;
"Occupied" was dropped from the legend as redundant, though a slot with a
coach already placed in it still renders disabled/orange in the grid itself,
just without a legend entry calling that color out by name) and the same
`getPaintLines()`/`getPaintInWorklist()` API calls, but the two page
components themselves share no code.

The Dashboard (`HomePage`) no longer shows the "Welcome, name / ROLE" text
block (redundant with the header). Admin's stat grid has 11 tiles (Pending
Shell Outturn, Awaiting Furnishing In, Awaiting Paint In, Awaiting Paint Out,
Awaiting Assembly In, Awaiting Assembly Out, Queued for Assignment, plus the
3 static counts — all system-wide via `admin/dashboard_stats.php`, computed
with dedicated queries rather than reusing the role-gated worklist endpoints)
so the page isn't mostly empty space. **Recent Activity** (`GET /api/dashboard/recent-activity.php`, limit
bumped 10→30) now has a filter box above it that searches coach
number/type/performer/type client-side; each non-Admin role's feed is scoped
to work *they* recorded (`WHERE recorded_by_user_id = :user_id`) — Shell
Production sees their own Shell Outturns, Furnishing sees their own
Furnishing In records, Paint sees their own Paint In/Paint Out (whichever
they're configured for), and Assembly Production sees their own Assembly
In/Assembly Out.

## Furnishing In is a manual, skill-gated step

Shell Outturn does **not** auto-create the Furnishing In record. Submitting
Shell Outturn only queues the coach to a skilled Furnishing employee
(`coach_assignments` module `FURNISHING`); that employee's own submission on
`/furnishing-in` — where the date field starts out pre-filled with the Shell
Outturn date but is fully editable before submitting — is what actually
creates the `furnishing_in_records` row (`backend/api/furnishing-in/create.php`)
and makes the coach Paint-In-eligible (queues it to a skilled Paint employee).
This was a deliberate correction: an earlier iteration made Furnishing In
fully automatic (same transaction as Shell Outturn, identical timestamp,
zero Furnishing-role action) — that turned out to be wrong for how this
actually works day-to-day, so it's back to being its own operation with its
own skill (`FURNISHING_IN`), just with the date conveniently pre-filled
rather than manually typed from scratch.

## Auto-assignment queue (Furnishing, Paint, Paint Out, Assembly In, Assembly Out)

`coach_assignments` (`backend/lib/Assignment.php`) tracks who owns the *next
action* on a coach, one row per (coach, module): FURNISHING → Furnishing In,
PAINT → Paint In, PAINT_OUT → Paint Out, ASSEMBLY_IN → Assembly In,
ASSEMBLY_OUT → Assembly Out. A coach becomes eligible the moment the
*previous* stage is recorded (Shell Outturn → FURNISHING, Furnishing In →
PAINT, Paint In → PAINT_OUT, Paint Out → ASSEMBLY_IN, Assembly In →
ASSEMBLY_OUT), and is auto-assigned to the least-loaded eligible employee
with capacity, or left `QUEUED` if none have room. Completing the action
marks that assignment `COMPLETED`, queues/assigns the coach for the next
stage, and pulls the completing employee's oldest matching `QUEUED` coach
into their now-freed capacity.

Two matching strategies coexist, selected per module in `Assignment.php` via
`SKILL_MODULES` (module → role_code) and `MATRIX_MODULES` (module → flag
column) lookup tables:

- **Skill-based** (`FURNISHING`, `ASSEMBLY_IN`, `ASSEMBLY_OUT`) —
  `skills`/`user_skills` at coach-CATEGORY granularity (LHB AC / LHB
  Non-AC), edited via Skill Master + "Edit Skills" on `/admin/users`.
  FURNISHING is **uncapped** (a single employee handles everything, nothing
  ever `QUEUED`); ASSEMBLY_IN/ASSEMBLY_OUT are **capped at 5** like Paint,
  since Assembly has the same multi-line, multi-worker physical setup.
  ASSEMBLY_IN and ASSEMBLY_OUT are tracked as separate skills/operations even
  though both map to role `ASSEMBLY_PRODUCTION` — a role no longer implies a
  single module, which is why `SKILL_MODULES` exists as its own lookup
  instead of assuming `module === role_code` (that assumption held for
  Furnishing only, back when Furnishing was the only skill-based module).
- **Matrix-based** (`PAINT`, `PAINT_OUT`) — `paint_type_assignments` at
  coach-TYPE granularity (e.g. LWCBAC, not just "LHB AC"), edited via the
  **Supervisor-Coach Assignments Matrix** (`/admin/paint-assignments`, Admin
  only) — `can_in` for PAINT, `can_out` for PAINT_OUT, same table, same
  employee pool (role PAINT). **Capped at 5** concurrently `ASSIGNED` coaches
  per employee — verified end-to-end via API tests (6 same-category coaches
  → 5 assigned + 1 queued → completing one auto-promotes the queued one).

Every entry page shows **only coaches assigned to the logged-in employee**
(not the whole eligible pool), with an "Assigned: X/5" (or "X" for
uncapped Furnishing) badge (`GET /api/assignments/my-summary.php?module=...`
— `module` is required for any role covering more than one stage: PAINT
passes `PAINT` or `PAINT_OUT`, ASSEMBLY_PRODUCTION passes `ASSEMBLY_IN` or
`ASSEMBLY_OUT`). Every stage's `create.php` rejects (403) if the coach isn't
currently assigned to the caller. Verified live end-to-end: a single coach
walked through Shell Outturn → Furnishing In → Paint In (paint1) → Paint Out
(paint2) → Assembly In (assemble1) → Assembly Out (assemble2), with each
submission correctly routing the coach to the next stage's assigned
employee.

## Supervisor-Coach Assignments (In-Out) Matrix — Paint only

`/admin/paint-assignments` (Admin only) — a grid of coach type (row) ×
Paint employee (column), each cell an independent **IN** / **OUT** toggle
(green = can do Paint In for that type, red = can do Paint Out — both live).
Row actions (`All IN` / `All OUT` / `Both` / clear) and column actions
(bulk-set one employee's whole row) speed up configuring many cells at once;
**Save** replaces the entire `paint_type_assignments` table with the current
grid state in one request
(`backend/api/admin/paint_type_assignments_save.php`) — simpler and safer
than diffing, since the whole grid is always submitted together.

This replaced Paint's old category-level Skill Master entry entirely (no
more "Paint In - LHB AC" style skills) — Furnishing/Assembly are untouched
and still use the plain skill checkboxes (see the Skill Master section
below — "Assembly In"/"Assembly Out" are now selectable operations there,
replacing the old placeholder "Assembly Operation"). Demo config: **paint1 =
Paint In**, **paint2 = Paint Out**, both across every coach type — verified
live end-to-end (see previous section).

A Paint employee (`/paint-in` or `/paint-out`) sees only their own assigned
coaches and that stage's line/slot grid, nothing else. Admin sees the full
4-tab overview instead (see "Layout" above).

## Per-employee stage access (Paint In vs. Paint Out, Assembly In vs. Assembly Out)

A role can now cover more than one pipeline stage (PAINT: Paint In *and*
Paint Out; ASSEMBLY_PRODUCTION: Assembly In *and* Assembly Out), but a given
**login** is not automatically capable of all of them — separate employees
are meant to handle separate directions (e.g. paint1 only does Paint In,
paint2 only does Paint Out), driven entirely by whether that employee has a
matrix cell (`paint_type_assignments.can_in`/`can_out`) or a skill
(`ASSEMBLY_IN`/`ASSEMBLY_OUT`) for at least one coach type/category — not by
their role alone.

`GET /api/assignments/my-capabilities.php` (`Assignment::userCapableModules()`)
returns the list of modules the *logged-in employee specifically* is
configured for, reusing the same `SKILL_MODULES`/`MATRIX_MODULES` lookup
`Assignment.php` already uses for routing coaches. `AuthContext` fetches this
once per login/session and exposes it as `capabilities: string[]`. Three
places consume it:

- **Sidebar nav** (`AppShell`'s `NAV_ITEMS`) — each stage-specific item
  carries a `module` field; `visibleNavItems()` filters by role **and**
  capability, so paint1's sidebar shows only "Paint In", paint2's shows only
  "Paint Out" — verified live (paint1 has no "Paint Out" link, paint2 has no
  "Paint In" link).
- **Routes** — `ProtectedRoute` takes an optional `requiredModule` prop;
  `/paint-in`, `/paint-out`, `/assembly-in`, `/assembly-out` (and
  `/furnishing-in`, for consistency) each pass their module. Direct
  navigation to a stage the employee isn't configured for renders "Not
  configured for this stage" instead of the page — verified live (paint1
  hitting `/paint-out` directly).
- **Dashboard stat cards** (`HomePage`) — `PaintStats`/`AssemblyStats` are
  thin wrappers that render `PaintInStats`/`PaintOutStats` (or
  `AssemblyInStats`/`AssemblyOutStats`) only if the capability is present,
  so a Paint-Out-only login never sees "Awaiting Paint In" tiles linking to
  a page it can't reach.

Furnishing is unaffected in practice (furnish1 has both category skills
seeded, so always capable) but goes through the same generic mechanism for
consistency — there's no special-casing for "the uncapped module."
Demo config: **assemble1 = Assembly In only**, **assemble2 = Assembly Out
only** — the same one-login-per-direction split as paint1/paint2, verified
live (assemble1's sidebar has no "Assembly Out" link, and vice versa).

## Coach detail drill-down (Admin)

Every row in Admin's **Recent Activity** feed is now a link to
`/admin/coaches/:coachId` — a full pipeline snapshot for that specific
coach, not just the one action that happened to show up in the feed.

- `GET /api/admin/coach_detail.php?coach_id=` (Admin only) queries all six
  transaction tables for that coach and returns: coach/BO info, a computed
  **current location** (which stage it's waiting on and who it's
  `ASSIGNED`/`QUEUED` to, via the same `coach_assignments` data the
  assignment engine uses — or `COMPLETED` once Assembly Out is done), the
  six-stage **workflow stepper** state (done/current/pending), and the full
  **history** in pipeline order, each entry carrying its recorded-by user,
  timestamp, line/slot location where applicable, and **remarks**.
- The frontend (`CoachDetailPage.tsx`) renders this as three sections: a
  Coach Information card, a Current Location card, a horizontal workflow
  stepper (green = done, blue outline = current, gray = pending), and a
  History list.
- `recent-activity.php` was extended to cover all six stages (it previously
  only had Shell Outturn/Furnishing In/Paint In) and now returns `coach_id`
  and `remarks` per row — both needed for the drill-down link and, for
  Paint/Assembly roles, so their own feed also spans both directions of
  their role (Paint: Paint In + Paint Out; Assembly: Assembly In + Assembly
  Out), not just the first one.
- **Bug fix while building this**: `furnishing_in_records` never had a
  `remarks` column — the Furnishing In form collected it and `create.php`
  parsed it from the request body, but silently dropped it before the
  INSERT. Added the column (`ALTER TABLE ... ADD COLUMN remarks`, mirrored
  in `schema.sql`) and wired it into the insert, so Furnishing In is
  consistent with every other stage's remarks handling.
- Verified live: a completed coach's detail page shows all 6 stages
  checked off with "Pipeline complete"; a mid-pipeline coach shows the
  correct current stage number, "Awaiting Paint Out" status, and its
  recorded remarks/line-slot history for the stages already done.

## Profile (all roles)

`/profile` — available to every role via the sidebar, not gated by
`NAV_ITEMS`. Shows the user's own employee no./username/role/skills
(`GET /api/profile/me.php`). The password form is collapsed by default behind
a "Change Password" toggle — only current-password/new/confirm fields appear
once clicked (`POST /api/profile/change-password.php`, requires the current
password, verified with `password_verify` before the new one is hashed and
stored).

## Skill master (Admin)

The doc's Admin responsibility is "create/maintain skill master **and**
assign skills to users" — we'd only built the second half. `admin/users.php`
now has a **Skill Master** section (`POST /api/admin/skills_create.php`):
name + operation (Furnishing In / Assembly In / Assembly Out — Paint uses
its own matrix instead, see above) + coach category, backed by the `skills`
table. This meant relaxing `skills`' unique constraint from
`(role_code, coach_category_id)` to `(role_code, coach_category_id, name)` —
multiple distinct skills can now cover the same role+category (e.g. two
different Furnishing skills both scoped to LHB AC); the assignment-queue
matching in `Assignment.php` already worked as a plain JOIN with no
uniqueness assumption, so this needed no engine changes. `admin/lookups.php`
now also returns `coach_categories` for the picker.

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

## Forgot Password (OTP via email)

Login page has a "Forgot password?" link → `/forgot-password`, a 3-step flow:
email → 6-digit OTP → new password + confirm → success → back to Sign In.

- `users.email` (nullable, unique) is the registered address OTPs go to.
  Admin's Create User form has an optional Email field for this; existing
  users without one just can't use the flow yet.
- `password_resets` tracks one row per OTP request: `otp_hash` (bcrypt, never
  stored in plaintext), `expires_at` (10 min), `attempts` (capped at 5), and
  `reset_token` — only set once the OTP is verified, and the only credential
  the final "set new password" step actually trusts. That split means a
  captured OTP screen/network call can't be replayed after the password's
  already changed, and the OTP itself never has to cross the wire again for
  the reset step.
- `forgot_password_request.php` always returns the same generic message
  whether or not the email is registered (no user enumeration), and rate-limits
  to one request per user per 60 seconds.
- **Email delivery**: `backend/lib/Mailer.php` is a ~90-line hand-rolled
  SMTP-over-STARTTLS client (no Composer/PHPMailer available on this machine)
  — EHLO, STARTTLS, AUTH LOGIN, one message, talking directly to
  `smtp.gmail.com:587`. Credentials live in `backend/config/.mail_credentials`
  (git-ignored JSON: host/port/username/password/from_name), read via
  `cts_mail_config()` in `config.php` — same pattern as the JWT secret file.
  Set `CTS_MAIL_HOST`/`CTS_MAIL_PORT`/`CTS_MAIL_USER`/`CTS_MAIL_PASS` as real
  env vars for an actual deployment instead. The sending Gmail account is
  independent of who receives the OTP — it can email any address stored in
  `users.email`, not just its own inbox (verified by sending to itself since
  that's an inbox we could actually check during testing).

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

- **Shell Outturn and Furnishing In are both date-only** (no time picker) —
  both send a fixed `00:00` time to their `create.php` endpoints, which
  already tolerated a missing/invalid time by defaulting it; both display
  date-only too (`formatDateOnly` in `utils/dateFormat.ts`). Paint In still
  has real date+time entry since it wasn't asked to change.
- `shell_to_furnishing_days` in `fixed_schedules` is a *planning target*, not
  an enforced rule — Furnishing In's date pre-fills from Shell Outturn but is
  editable (see "Furnishing In is a manual, skill-gated step" above), so the
  two dates can legitimately differ.
- Paint In slots are permanently occupied for the life of this phase — Paint
  Out does **not** free the Paint In slot it came from; it books a slot in
  its own independent `paint_out_lines` pool instead (same for Assembly In
  and Assembly Out). A coach's full journey is a straight line through four
  separate 100-slot pools, not a single pool it enters and exits repeatedly.
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
- Access control is role-level (route/API gated by role code) plus
  per-employee assignment via the queue above, for every live module
  (Furnishing, Paint, Paint Out, Assembly In, Assembly Out).
  Coach-type/operation-stage-level filtering for other roles (Inspection,
  etc.) is deferred until those modules exist.
- **"Assembly Operations"** — a stage between Assembly In and Assembly Out —
  is explicitly deferred to a future phase; Assembly Out is currently the
  end of the pipeline.
- Out of scope for this phase: Mechanical/Electrical Inspection, Shunting,
  Vendor/SNI, Final Inspection, Outturn/Dispatch, Assembly Operations, and
  full RBAC configuration screens.
