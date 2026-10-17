import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create your free account", description: "Create a free Life OS account to keep your tasks, calendar, habits, goals, notes and money in one private workspace.", alternates: { canonical: "/signup" } };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Free, private, and yours to export or delete any time.</p>
      <AuthForm action={signUp} fields={["name", "email", "password"]} submit="Create account" newPassword>
        <p className="text-xs text-muted-foreground">By creating an account you agree to the <Link href="/privacy" className="underline">privacy notice</Link>. Use at least 8 characters.</p>
        <p className="text-sm">Already have an account? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></p>
      </AuthForm>
    </>
  );
}
