/** Fraction (0–1) of the way from `start` to `target`. Works for increasing and decreasing targets (e.g. weight loss). */
export function goalProgress(g: { start_value: number; current_value: number; target_value: number }): number {
  const span = g.target_value - g.start_value;
  if (span === 0) return 0;
  return Math.min(1, Math.max(0, (g.current_value - g.start_value) / span));
}

export function goalReached(g: { start_value: number; current_value: number; target_value: number }): boolean {
  return g.target_value >= g.start_value ? g.current_value >= g.target_value : g.current_value <= g.target_value;
}

export const fmtNum = (n: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
