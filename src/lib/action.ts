import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE } from "@/lib/dates";
import type { Profile } from "@/types/db";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** An error whose message is safe to show to the user. */
export class ActionError extends Error {}

export interface ActionContext {
  supabase: SupabaseClient;
  user: User;
  profile: () => Promise<Profile>;
}

/** Throws a user-safe ActionError for a failed Supabase response; never leaks raw database messages. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrap<T = any>(res: { data: unknown; error: { code?: string; message?: string } | null }): T {
  if (res.error) throw mapDbError(res.error);
  return res.data as T;
}

export function mapDbError(error: { code?: string; message?: string }): ActionError {
  switch (error.code) {
    case "23505":
      return new ActionError("That already exists.");
    case "23503":
      return new ActionError("A linked item no longer exists. Refresh and try again.");
    case "23514":
    case "22P02":
    case "22007":
      return new ActionError("Some of the values are not valid.");
    case "42501":
      return new ActionError("You are not allowed to do that.");
    default:
      console.error("[db]", error.code, error.message);
      return new ActionError("Something went wrong. Please try again.");
  }
}

/**
 * Wraps a server action: authenticates the caller (verified server-side via getUser),
 * converts validation/database errors to safe, typed results.
 */
export async function run<T>(fn: (ctx: ActionContext) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { ok: false, error: "You need to sign in again." };
    let cached: Promise<Profile> | undefined;
    const profile = () =>
      (cached ??= (async () => {
        const res = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        if (res.error) throw mapDbError(res.error);
        return (
          (res.data as Profile | null) ??
          ({ id: data.user.id, timezone: DEFAULT_TIMEZONE, currency: "BDT", week_start: 1 } as Profile)
        );
      })());
    return { ok: true, data: await fn({ supabase, user: data.user, profile }) };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
    }
    if (err instanceof ActionError) return { ok: false, error: err.message };
    // Next.js control-flow errors (redirect/notFound) must propagate.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[action]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
