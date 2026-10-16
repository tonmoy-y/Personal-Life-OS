"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle aria-hidden /></div>
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">We couldn’t load this page. Your data is safe. Check your connection and try again.</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <div className="flex gap-2"><Button onClick={reset}>Try again</Button><Button variant="outline" asChild><Link href="/dashboard">Dashboard</Link></Button></div>
    </main>
  );
}
