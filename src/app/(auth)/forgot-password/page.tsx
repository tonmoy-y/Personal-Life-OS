import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Enter your email and we’ll send a reset link.</p>
      <AuthForm action={requestPasswordReset} fields={["email"]} submit="Send reset link">
        <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Back to sign in</Link>
      </AuthForm>
    </>
  );
}
