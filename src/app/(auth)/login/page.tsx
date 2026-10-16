import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/url";
import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  const notice = sp.deleted ? "Your account and all its data have been deleted." : sp.error === "link" ? "That link is invalid or has expired. Sign in, or request a new one." : null;
  return (
    <>
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Sign in to your Life OS.</p>
      {notice && <p role="status" className="mb-4 rounded-lg border bg-muted px-3 py-2 text-sm">{notice}</p>}
      <AuthForm action={signIn} fields={["email", "password"]} submit="Sign in" hidden={{ next }}>
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">Forgot password?</Link>
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
        </div>
      </AuthForm>
    </>
  );
}
