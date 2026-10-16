"use client";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Field, selectClass } from "@/components/common/field";
import { useAction } from "@/components/common/use-action";
import { useAppData } from "@/components/layout/app-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { todayIn } from "@/lib/dates";
import { minorToDecimal } from "@/lib/money";
import type { Transaction } from "@/types/db";
import { createTransaction, updateTransaction } from "./actions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, transactionInputSchema } from "./schema";

type V = { type: "income" | "expense"; amount: string; occurred_on: string; category: string; description: string; payment_method: string };

export function TransactionFormDialog({ open, onOpenChange, txn = null, defaultType = "expense" }: { open: boolean; onOpenChange: (o: boolean) => void; txn?: Transaction | null; defaultType?: "income" | "expense" }) {
  const { profile } = useAppData();
  const { exec, pending } = useAction();
  const { register, handleSubmit, reset, control, setError, formState: { errors } } = useForm<V>();
  const type = useWatch({ control, name: "type" });

  useEffect(() => {
    if (!open) return;
    reset(txn
      ? { type: txn.type, amount: minorToDecimal(txn.amount_minor, txn.currency), occurred_on: txn.occurred_on, category: txn.category, description: txn.description ?? "", payment_method: txn.payment_method ?? "" }
      : { type: defaultType, amount: "", occurred_on: todayIn(profile.timezone), category: "", description: "", payment_method: "" });
  }, [open, txn, defaultType, profile.timezone, reset]);

  const onSubmit = handleSubmit(async (v) => {
    const check = transactionInputSchema.safeParse(v);
    if (!check.success) {
      for (const i of check.error.issues) setError(i.path[0] as keyof V, { message: i.message });
      return;
    }
    const res = await exec<unknown>(() => (txn ? updateTransaction(txn.id, v) : createTransaction(v)), { success: txn ? "Transaction updated" : "Transaction saved" });
    if (res.ok) onOpenChange(false);
  });

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{txn ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Amounts are recorded in {profile.currency}. Nothing is connected to a bank.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["expense", "income"] as const).map((t) => (
              <label key={t} className="cursor-pointer rounded-lg py-1.5 text-center text-sm font-medium capitalize has-[:checked]:bg-card has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <input type="radio" value={t} className="sr-only" {...register("type")} />{t}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="tx-amount" label={`Amount (${profile.currency})`} required error={errors.amount?.message}><Input id="tx-amount" inputMode="decimal" autoFocus placeholder="0.00" {...register("amount")} /></Field>
            <Field id="tx-date" label="Date" required error={errors.occurred_on?.message}><Input id="tx-date" type="date" {...register("occurred_on")} /></Field>
          </div>
          <Field id="tx-cat" label="Category" required error={errors.category?.message}>
            <Input id="tx-cat" list="tx-cat-list" placeholder="Choose or type…" {...register("category")} />
            <datalist id="tx-cat-list">{cats.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field id="tx-desc" label="Description" error={errors.description?.message}><Input id="tx-desc" maxLength={300} {...register("description")} /></Field>
          <Field id="tx-pm" label="Payment method">
            <select id="tx-pm" className={selectClass} {...register("payment_method")}><option value="">—</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : txn ? "Save changes" : "Add transaction"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
