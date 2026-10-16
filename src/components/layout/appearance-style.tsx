import type { Profile } from "@/types/db";

/** hue, chroma and light-mode lightness per accent. Only these enum-validated values are ever interpolated. */
const ACCENTS: Record<Profile["accent"], { h: number; c: number; l: number }> = {
  teal: { h: 185, c: 0.09, l: 0.45 },
  indigo: { h: 268, c: 0.15, l: 0.48 },
  rose: { h: 10, c: 0.17, l: 0.52 },
  amber: { h: 62, c: 0.13, l: 0.5 },
  emerald: { h: 155, c: 0.12, l: 0.46 },
  violet: { h: 295, c: 0.16, l: 0.49 },
  slate: { h: 255, c: 0.03, l: 0.4 },
};
const RADIUS = { sharp: "0.3rem", round: "0.75rem", pill: "1.25rem" } as const;
const SIZE = { sm: "15px", md: "16px", lg: "17.5px" } as const;

export function appearanceCss(p: Pick<Profile, "accent" | "density" | "text_size" | "corners">): string {
  const a = ACCENTS[p.accent] ?? ACCENTS.teal;
  const { h, c, l } = a;
  const light = `--primary:oklch(${l} ${c} ${h});--primary-foreground:oklch(0.985 0.005 ${h});--accent:oklch(0.935 ${Math.min(c / 3, 0.04).toFixed(3)} ${h});--accent-foreground:oklch(0.3 ${(c * 0.7).toFixed(3)} ${h});--ring:oklch(${l + 0.1} ${c} ${h});--chart-1:oklch(${l + 0.1} ${c} ${h});--sidebar-primary:oklch(${l} ${c} ${h});--sidebar-primary-foreground:oklch(0.985 0.005 ${h});--sidebar-accent:oklch(0.925 ${Math.min(c / 3, 0.035).toFixed(3)} ${h});--sidebar-accent-foreground:oklch(0.3 ${(c * 0.7).toFixed(3)} ${h});--sidebar-ring:oklch(${l + 0.1} ${c} ${h});`;
  const dark = `--primary:oklch(0.76 ${(c * 1.2).toFixed(3)} ${h});--primary-foreground:oklch(0.2 0.03 ${h});--accent:oklch(0.3 ${Math.min(c / 2.2, 0.05).toFixed(3)} ${h});--accent-foreground:oklch(0.92 0.04 ${h});--ring:oklch(0.65 ${c} ${h});--chart-1:oklch(0.76 ${(c * 1.2).toFixed(3)} ${h});--sidebar-primary:oklch(0.76 ${(c * 1.2).toFixed(3)} ${h});--sidebar-primary-foreground:oklch(0.2 0.03 ${h});--sidebar-accent:oklch(0.28 ${Math.min(c / 2.5, 0.045).toFixed(3)} ${h});--sidebar-accent-foreground:oklch(0.92 0.04 ${h});--sidebar-ring:oklch(0.65 ${c} ${h});`;
  const root = `--radius:${RADIUS[p.corners] ?? RADIUS.round};${p.density === "compact" ? "--spacing:0.21rem;" : ""}`;
  return `:root{${light}${root}}.dark{${dark}}html{font-size:${SIZE[p.text_size] ?? SIZE.md}}`;
}

export function AppearanceStyle({ profile }: { profile: Pick<Profile, "accent" | "density" | "text_size" | "corners"> }) {
  // CSS is built only from enum-validated tokens above, never from free text.
  return <style dangerouslySetInnerHTML={{ __html: appearanceCss(profile) }} />;
}
