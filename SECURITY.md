# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Use GitHub's private reporting instead:
**Security → Report a vulnerability** on this repository. Include what you found, how to reproduce it, and the impact you expect.

I will acknowledge a report as soon as I can and credit you in the fix if you wish.

## Scope and design

- Data isolation relies on Postgres Row Level Security: every user-owned table is owner-only, and the `anon` role has no table privileges. `npm run test:rls` proves cross-user isolation against a throwaway Postgres.
- The app only ever uses Supabase's **publishable** key in the browser. There is no service-role key in this repository or in the deployed app. If you find one, that is a vulnerability: report it.
- Never commit `.env*` files, access tokens or API keys. If you contributed a secret by mistake, rotate it immediately and tell me.
