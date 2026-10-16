"use server";
import { revalidatePath } from "next/cache";
import { ActionError, run, unwrap, type ActionResult } from "@/lib/action";
import { parseMoney } from "@/lib/money";
import { idSchema } from "@/lib/validation";
import { budgetInputSchema, transactionInputSchema, type BudgetInput, type TransactionInput } from "./schema";

const touch = () => { for (const p of ["/finance", "/dashboard", "/analytics"]) revalidatePath(p); };

function minor(amount: string, currency: string): number {
  const m = parseMoney(amount, currency);
  if (m === null || m <= 0) throw new ActionError(`Enter a valid positive amount in ${currency} (max ${currency === "JPY" ? "0" : "2"} decimals).`);
  return m;
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, user, profile }) => {
    const t = transactionInputSchema.parse(input);
    const { currency } = await profile();
    const row = unwrap(
      await supabase.from("transactions").insert({ user_id: user.id, type: t.type, amount_minor: minor(t.amount, currency), currency, occurred_on: t.occurred_on, category: t.category, description: t.description, payment_method: t.payment_method }).select("id").single(),
    ) as { id: string };
    touch();
    return { id: row.id };
  });
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  return run(async ({ supabase, profile }) => {
    const t = transactionInputSchema.parse(input);
    const { currency } = await profile();
    const rows = unwrap(
      await supabase.from("transactions").update({ type: t.type, amount_minor: minor(t.amount, currency), currency, occurred_on: t.occurred_on, category: t.category, description: t.description, payment_method: t.payment_method }).eq("id", idSchema.parse(id)).select("id"),
    ) as unknown[];
    if (!rows.length) throw new ActionError("That transaction no longer exists.");
    touch();
  });
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("transactions").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}

/** One budget limit per (month, category); setting it again updates the limit. */
export async function upsertBudget(input: BudgetInput): Promise<ActionResult> {
  return run(async ({ supabase, user, profile }) => {
    const b = budgetInputSchema.parse(input);
    const { currency } = await profile();
    unwrap(
      await supabase.from("budgets").upsert({ user_id: user.id, month: `${b.month}-01`, category: b.category, limit_minor: minor(b.amount, currency), currency }, { onConflict: "user_id,month,category" }),
    );
    touch();
  });
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  return run(async ({ supabase }) => {
    unwrap(await supabase.from("budgets").delete().eq("id", idSchema.parse(id)));
    touch();
  });
}
