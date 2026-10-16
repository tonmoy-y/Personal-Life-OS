import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="paper-grain flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <Logo />
      <p className="font-heading text-8xl font-semibold text-primary/30">404</p>
      <h1 className="text-3xl font-semibold">This page wandered off</h1>
      <p className="max-w-sm text-muted-foreground">The page you’re looking for doesn’t exist, or it isn’t yours to see.</p>
      <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
    </main>
  );
}
