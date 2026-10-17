/** A short single-line excerpt of `text` around the first case-insensitive match of `term`, or null when it does not occur. */
export function snippet(text: string | null | undefined, term: string, max = 72): string | null {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  const needle = term.trim().toLowerCase();
  if (!flat || !needle) return null;
  const at = flat.toLowerCase().indexOf(needle);
  if (at < 0) return null;
  const before = Math.max(0, at - Math.floor((max - needle.length) / 3));
  const end = Math.min(flat.length, before + max);
  return `${before > 0 ? "…" : ""}${flat.slice(before, end)}${end < flat.length ? "…" : ""}`;
}
