# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem: a public report tells everyone how to exploit it before it is fixed.

1. Preferred: use GitHub's private reporting. Go to the **Security** tab of this repository and choose **Report a vulnerability** (<https://github.com/tonmoy-y/Personal-Life-OS/security/advisories/new>). Include what you found, steps to reproduce, and the impact you expect.
2. If that option is not available to you, open a public issue titled **"Security contact request"** with *no technical details at all*. I will reply there and move the conversation to a private channel.

I will acknowledge a report as soon as I can, keep you updated, and credit you in the fix if you wish. This is a personal project maintained in spare time and has no bug bounty.

## Testing the live app responsibly

The live instance (<https://personallifeos.tonmoyy.dev>) is real infrastructure on free tiers. Please:

- Only test with accounts you created yourself and never access, modify or delete another person's data.
- Do not run denial-of-service, load or bulk-signup tests. Do not trigger large numbers of emails: sign-up and password-reset mail goes through a free provider with a small daily cap.
- Stop and report as soon as you can show an issue; do not keep exploring or exfiltrate data.

Good-faith research that follows these rules is welcome. Anything else may be treated as abuse.

## In scope

Anything that breaks the design below, for example: reading or changing another user's data, bypassing authentication, XSS or injection, open redirects, leaking secrets, or weakening Row Level Security.

## Out of scope

Missing best-practice headers without a demonstrated impact, self-XSS, rate-limit complaints without an exploit, issues that need a rooted or compromised device, and vulnerabilities in third-party services (Supabase, Vercel, Resend, Cloudflare) that should go to those vendors.

## Design notes

- Data isolation relies on Postgres Row Level Security: every user-owned table is owner-only, and the `anon` role has no table privileges. `npm run test:rls` proves cross-user isolation against a throwaway Postgres.
- Only Supabase's **publishable** key is used in browsers; there is no service-role key in this repository or the deployed app. If you find one, that is a vulnerability: report it.
- Notes (Markdown) are sanitised with DOMPurify, and responses carry a Content-Security-Policy and other hardening headers.
- Never commit `.env*` files, access tokens or API keys. If you committed a secret by mistake, rotate it immediately and tell me.
