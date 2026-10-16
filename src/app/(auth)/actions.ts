"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/url";

export interface AuthState { error?: string; message?: string; fields?: { email?: string; name?: string } }

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address"));
const password = z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters");

async function clientKey() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

async function origin() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site && /^https?:\/\//.test(site)) return site.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password").max(72) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: { email: String(form.get("email") ?? "") } };
  if (!rateLimit(`signin:${await clientKey()}:${parsed.data.email}`, 8, 60_000)) return { error: "Too many attempts. Please wait a minute and try again.", fields: { email: parsed.data.email } };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = error.code === "email_not_confirmed";
    return { error: unconfirmed ? "Please verify your email first — check your inbox for the confirmation link." : error.status === 429 ? "Too many attempts. Please try again shortly." : "Incorrect email or password.", fields: { email: parsed.data.email } };
  }
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password, name: z.string().trim().max(80).optional() }).safeParse({ email: form.get("email"), password: form.get("password"), name: form.get("name") || undefined });
  const fields = { email: String(form.get("email") ?? ""), name: String(form.get("name") ?? "") };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  if (!rateLimit(`signup:${await clientKey()}`, 5, 10 * 60_000)) return { error: "Too many sign-up attempts. Please try again later.", fields };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${await origin()}/auth/confirm?next=/onboarding`, data: parsed.data.name ? { display_name: parsed.data.name } : {} },
  });
  if (error) return { error: error.code === "weak_password" ? "That password is too weak. Try a longer, less common one." : error.status === 429 ? "Too many attempts. Please try again later." : "We couldn't create your account. Please try again.", fields };
  if (data.session) redirect("/onboarding"); // email confirmation disabled on the project
  // Same message whether or not the address already exists (no account enumeration).
  return { message: "Check your email — we sent a confirmation link to finish creating your account." };
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address", fields: { email: String(form.get("email") ?? "") } };
  if (!rateLimit(`reset:${await clientKey()}`, 5, 10 * 60_000)) return { error: "Too many requests. Please try again later.", fields: { email: parsed.data } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${await origin()}/auth/confirm?next=/reset-password` });
  if (error?.status === 429) return { error: "Too many requests. Please try again later.", fields: { email: parsed.data } };
  return { message: "If an account exists for that address, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" }).safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.code === "same_password" ? "Choose a password you haven't used before." : error.code === "weak_password" ? "That password is too weak." : "We couldn't update your password. Please try again." };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
