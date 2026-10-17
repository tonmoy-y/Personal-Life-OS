/** Build a safe `%term%` pattern for PostgREST `ilike` inside `or()`: strips wildcards and filter-syntax characters. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_,()"*:]/g, " ").trim()}%`;
}
