import type { Metadata } from "next";
import { updatePassword } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">You opened a secure reset link. Pick a new password to continue.</p>
      <AuthForm action={updatePassword} fields={["password", "confirm"]} submit="Update password" newPassword />
    </>
  );
}
