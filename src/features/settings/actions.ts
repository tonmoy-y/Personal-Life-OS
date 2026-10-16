"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { profileInputSchema, type ProfileInput } from "./schema";

export async function updateProfile(input: ProfileInput, opts: { onboarded?: boolean } = {}): Promise<ActionResult> {
  return run(async ({ supabase, user }) => {
    const p = profileInputSchema.parse(input);
    unwrap(await supabase.from("profiles").upsert({ id: user.id, ...p, ...(opts.onboarded ? { onboarded: true } : {}) }, { onConflict: "id" }));
    revalidatePath("/", "layout");
  });
}

export async function completeOnboarding(input: ProfileInput): Promise<ActionResult> {
  return updateProfile(input, { onboarded: true });
}

/**
 * Permanently deletes the signed-in user's account and ALL their data via the `delete_my_account()` SQL
 * function (cascades from auth.users). Only reports success after the database call has succeeded.
 */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  const result = await run(async ({ supabase, user }) => {
    if (confirmation.trim() !== "DELETE") throw new ActionError('Type DELETE to confirm.');
    if (!rateLimit(`delete:${user.id}`, 3, 60_000)) throw new ActionError("Too many attempts. Wait a minute and try again.");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      console.error("[delete_my_account]", error.code, error.message);
      throw new ActionError("We couldn't delete your account. Nothing was deleted — please try again or contact support.");
    }
  });
  if (!result.ok) return result;
  // Account is gone; clear the now-orphaned session cookies. Failure here is harmless.
  try { await (await createClient()).auth.signOut({ scope: "local" }); } catch { /* ignore */ }
  redirect("/login?deleted=1");
}
