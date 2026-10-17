/** Build a safe `%term%` pattern for PostgREST `ilike` inside `or()`: strips wildcards and filter-syntax characters. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_,()"*:]/g, " ").trim()}%`;
}

/** `,tags.cs.{term}` for an or() filter so an exact (lower-cased) tag also matches; empty when the term has no usable characters. */
export function tagClause(q: string): string {
  const t = q.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}_-]/gu, "");
  return t ? `,tags.cs.{${t}}` : "";
}
