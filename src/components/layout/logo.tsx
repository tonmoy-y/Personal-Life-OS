import { cn } from "@/lib/utils";

/**
 * Life OS mark: an "L" that carries today forward (the dot + ring), on a glass tile.
 * The tile follows the user's accent colour; `inverted` is for use on an accent-coloured surface.
 */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const glyph = inverted ? "var(--primary)" : "var(--primary-foreground)";
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("size-8 shrink-0", className)}>
      <defs>
        <linearGradient id="lifeos-tile" x1="12" y1="0" x2="88" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "color-mix(in oklch, var(--primary) 80%, white)" }} />
          <stop offset="1" style={{ stopColor: "color-mix(in oklch, var(--primary) 78%, black)" }} />
        </linearGradient>
        <linearGradient id="lifeos-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="29" fill={inverted ? "#fff" : "url(#lifeos-tile)"} />
      {!inverted && <rect width="100" height="56" rx="29" fill="url(#lifeos-gloss)" />}
      <circle cx="68" cy="33" r="17" fill="none" style={{ stroke: glyph }} strokeOpacity="0.38" strokeWidth="2.2" />
      <path d="M33 21V65Q33 76 44 76H73" fill="none" style={{ stroke: glyph }} strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="33" r="8.5" style={{ fill: glyph }} />
    </svg>
  );
}

export function Logo({ className, collapsed = false, inverted = false }: { className?: string; collapsed?: boolean; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-heading text-[1.6rem] leading-none tracking-tight", className)}>
      <LogoMark inverted={inverted} />
      {!collapsed && <span>Life <em className={inverted ? "" : "text-primary"}>OS</em></span>}
    </span>
  );
}
