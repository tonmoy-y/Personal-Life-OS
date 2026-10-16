import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="currentColor" opacity="0.14" />
      <path d="M9 22.5V9.5h3.6v9.8H20v3.2H9Z" fill="currentColor" />
      <circle cx="22.4" cy="10.4" r="2.6" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight", className)}>
      <LogoMark className="text-primary" />
      {!collapsed && <span>Life OS</span>}
    </span>
  );
}
