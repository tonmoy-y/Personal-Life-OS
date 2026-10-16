"use client";
import { useActionState, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthState } from "./actions";

type Fields = ("name" | "email" | "password" | "confirm")[];
const META = {
  name: { label: "Name", type: "text", autoComplete: "name" },
  email: { label: "Email", type: "email", autoComplete: "email" },
  password: { label: "Password", type: "password", autoComplete: "current-password" },
  confirm: { label: "Confirm password", type: "password", autoComplete: "new-password" },
} as const;

export function AuthForm({ action, fields, submit, hidden, newPassword, children }: {
  action: (prev: AuthState, form: FormData) => Promise<AuthState>;
  fields: Fields;
  submit: string;
  hidden?: Record<string, string>;
  newPassword?: boolean;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.message) {
    return (
      <div role="status" className="grid gap-3 rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-5 text-success" aria-hidden /> Done</p>
        <p>{state.message}</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f, i) => (
        <Field key={f} id={`auth-${f}`} label={META[f].label} required={f !== "name"}>
          <Input id={`auth-${f}`} name={f} type={META[f].type} autoComplete={f === "password" && newPassword ? "new-password" : META[f].autoComplete}
            defaultValue={f === "email" ? state.fields?.email : f === "name" ? state.fields?.name : undefined} autoFocus={i === 0} required={f !== "name"}
            aria-describedby={state.error ? "auth-error" : undefined} minLength={f === "password" && newPassword ? 8 : undefined} maxLength={f === "email" ? 254 : 72} />
        </Field>
      ))}
      {state.error && <p id="auth-error" role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="h-10">{pending && <Loader2 className="animate-spin" />}{submit}</Button>
      {children}
    </form>
  );
}
