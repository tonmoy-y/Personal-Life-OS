import { z } from "zod";
import { localDate, optText } from "@/lib/validation";

export const EXPENSE_CATEGORIES = ["Food", "Transport", "Housing", "Utilities", "Health", "Education", "Entertainment", "Shopping", "Savings", "Other"];
export const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Gift", "Interest", "Other"];
export const PAYMENT_METHODS = ["Cash", "Card", "Bank transfer", "Mobile banking", "Other"];

/** `amount` is a decimal string ("1,250.50"); the server converts it to integer minor units in the profile currency. */
export const transactionInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.string().trim().min(1, "Enter an amount").max(24),
  occurred_on: localDate,
  category: z.string().trim().min(1, "Choose a category").max(60),
  description: optText(300),
  payment_method: optText(40),
});
export type TransactionInput = z.input<typeof transactionInputSchema>;

export const budgetInputSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month"),
  category: z.string().trim().min(1, "Choose a category").max(60),
  amount: z.string().trim().min(1, "Enter a limit").max(24),
});
export type BudgetInput = z.input<typeof budgetInputSchema>;
