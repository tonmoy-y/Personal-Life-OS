# Contributing

Thanks for helping. Please keep changes small and focused.

## Setup

```bash
npm install
cp .env.example .env.local   # your own Supabase project URL + publishable key
npm run dev
```

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run test:rls   # needs PostgreSQL binaries locally; see scripts/test-rls.sh
```

Database changes go in a new file under `supabase/migrations/` (never edit an applied migration) and must keep Row Level Security on, with owner-only policies. Add or extend a test in `supabase/tests/rls.sql` when you add a table.

## Ground rules

- No secrets, tokens or personal data in commits, tests or fixtures.
- Server actions must authenticate, validate with Zod and return safe error messages.
- UI changes should work in light and dark mode and at phone width.
