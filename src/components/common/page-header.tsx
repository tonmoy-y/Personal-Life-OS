import type { ReactNode } from "react";

export function PageHeader({
  title, description, actions, eyebrow,
}: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-6">
      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"><span aria-hidden className="h-px w-6 bg-primary" />{eyebrow ?? "Life OS"}</p>
        <h1 className="text-balance text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-prose text-pretty text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
