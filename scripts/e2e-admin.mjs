#!/usr/bin/env node
// Test-only helper: create/delete E2E users via the Supabase Management API (no emails are sent).
// Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/e2e-admin.mjs create <e2e-email@example.test> <password> | delete <e2e-prefix>
const [, , cmd, a, b] = process.argv;
const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env;
if (!token || !ref) throw new Error("Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF");
if (!/^e2e-[a-z0-9-]+(@example\.test)?$/.test(a ?? "")) throw new Error("Refusing: only e2e-*@example.test users");
const esc = (s) => s.replace(/'/g, "''");
const sql = cmd === "create"
  ? `with u as (insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${esc(a)}', crypt('${esc(b)}', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"E2E"}', now(), now(), '', '', '', '') returning id, email)
     insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       select gen_random_uuid(), id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now() from u`
  : `delete from auth.users where email like '${esc(a.replace(/@example\.test$/, ""))}%@example.test'`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
});
if (!res.ok) throw new Error(await res.text());
console.log(cmd, "ok");
