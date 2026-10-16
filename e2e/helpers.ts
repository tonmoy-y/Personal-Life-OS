import type { Page } from "@playwright/test";

/**
 * E2E users are created through the real sign-up UI. Email confirmation is then marked complete by
 * `scripts/e2e-admin.mjs` (Management API, needs SUPABASE_ACCESS_TOKEN) — no service-role key is used.
 */
export const stamp = process.env.E2E_STAMP ?? 'local';
export const userA = { email: `e2e-a-${stamp}@example.test`, password: "Test-pass-12345" };
export const userB = { email: `e2e-b-${stamp}@example.test`, password: "Test-pass-12345" };

export async function signIn(page: Page, u: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Password").fill(u.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
