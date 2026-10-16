"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle aria-hidden /></div>
      <h1 className="text-2xl font-semibold">We couldn’t load this section</h1>
      <p className="text-sm text-muted-foreground">This is usually a connection problem. Your data is safe — try again.</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
