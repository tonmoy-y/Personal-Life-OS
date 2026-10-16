# Personal Life OS

A private, mobile-first workspace for one person's tasks, calendar, habits, goals, projects, notes and money. Built with Next.js 16 (App Router), TypeScript (strict), Tailwind v4, shadcn/ui, Supabase (Postgres, Auth, RLS) and Recharts. No paid AI or third-party APIs are required.

## Features

| Module | Highlights |
| --- | --- |
| Dashboard / Today | Local-date greeting, overdue + today's tasks, upcoming events, habits, goals, month spending, configurable widgets |
| Tasks | CRUD, list/board, filters, search, sort, saved views (per device), recurrence with idempotent next-occurrence generation, undo for delete |
| Calendar | Month / week / agenda; events, task due dates, project deadlines, milestones; timezone-correct |
| Habits | Weekday schedules, duplicate-proof check-ins, streaks/rates computed from the habit's schedule and your local date, heatmaps |
| Goals | Measurable targets (up or down), milestones, progress history chart |
| Projects | Progress derived from real tasks, milestones, project detail |
| Notes | Markdown, DOMPurify-sanitized preview, tags, pin/archive, optimistic-concurrency autosave with conflict handling |
| Finance | Integer-minor-unit money, budgets vs. actual, trends, filters, CSV export; no bank connections |
| Analytics | Defined periods, charts with labels/legends/empty states |
| Utilities | Command palette (⌘K), global search, quick-add, keyboard shortcuts (`?`), JSON/CSV export, account deletion, onboarding, light/dark/system themes |

## Honest limitations

- **Reminders are in-app only.** Browser notifications (opt-in) fire only while the app is open in a tab. There is no email/SMS/push scheduler, so nothing is delivered when the app is closed.
- No Google Calendar sync. No offline sync (the manifest enables installing the app; it does not make it work offline).
- Rate limiting is best-effort in-memory per server instance; Supabase Auth's limits are authoritative.
- Changing currency doesn't convert old amounts; other-currency transactions are excluded from totals and the UI says so.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev                  # http://localhost:3000
```

Without credentials the app builds and every route redirects to `/setup`, which lists the missing variable names. It never falls back to browser storage.

### Environment variables (names only)

| Name | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | local + Vercel | `sb_publishable_…` (safe for browsers; RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | local + Vercel | Public origin, used in auth email links |

No service-role key is used anywhere. Account deletion uses the `delete_my_account()` SQL function.

## Supabase setup

1. Create a project at supabase.com.
2. Run the migration in `supabase/migrations/` — paste it into the SQL editor, or `npx supabase link --project-ref <ref>` then `npx supabase db push` (needs the database password).
3. **Authentication → URL Configuration**: set *Site URL* to your deployment URL and add `https://<your-domain>/**` and `http://localhost:3000/**` to *Redirect URLs*.
4. **Authentication → Email Templates**: point links at the token-hash route so they work across devices:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
5. Supabase's built-in email sender is heavily rate-limited — configure a custom SMTP provider for real use.

## Database & security model

- Every user-owned table has `user_id`, RLS enabled, and owner-only select/insert/update/delete policies (`with check` on writes so rows can't be reassigned). `anon` has no table privileges.
- Cross-table links use composite foreign keys `(child_id, user_id) → parent(id, user_id)`, so a row can never reference another user's parent. Unique constraints are scoped by `user_id` so they can't leak other users' data.
- Money is `bigint` minor units; dates the user thinks in (due dates, habit days, transactions) are `date` in their timezone; instants are `timestamptz`.
- Server actions authenticate with `auth.getUser()`, validate with Zod, and map database errors to safe messages.
- Notes are rendered only in the browser through DOMPurify; CSV export neutralizes spreadsheet formulas; post-login redirects are same-origin only; security headers are set in `next.config.ts`.

## Tests

```bash
npm run lint && npm run typecheck
npm test            # unit: dates/timezones, recurrence, habit streaks, money, budgets, analytics, CSV, redirects
npm run test:rls    # throwaway local Postgres: applies migrations, proves cross-user isolation & constraints
npm run test:e2e    # Playwright against the Supabase project in .env.local (see below)
```

E2E uses `scripts/e2e-admin.mjs` to create/delete confirmed `e2e-*@example.test` users through the Supabase Management API (set `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `E2E_STAMP`; no emails are sent). Run it only against a project you're happy to create temporary test users in; the script deletes them afterwards. Never commit tokens.

## Deployment (Vercel)

1. Import the GitHub repo in Vercel (framework: Next.js; defaults are correct).
2. Add the three environment variables above for Production and Preview.
3. Pushing to `main` deploys to production; other branches and PRs get preview deployments. Add each preview/production URL to Supabase's redirect allow-list.
4. CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build and the RLS test.

## Account data

Settings → **Your data** downloads a full JSON export or per-list CSVs (own records only). Settings → **Delete account** permanently removes the account and all data and only reports success after the database call succeeds.

## Dev-only demo data

`scripts/seed-dev.sql` seeds demo rows for one existing user, refuses to run unless `app.allow_dev_seed = on`, and is never run automatically or in production.
