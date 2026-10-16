/** Only allow same-origin relative paths for post-login redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\u0000-\u001f]/.test(next)) {
    return fallback;
  }
  return next;
}

/** Returns a copy of `params` with each update applied (empty/null removes the key). */
export function mergeParams(params: URLSearchParams | string, updates: Record<string, string | null>): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v) next.set(k, v);
    else next.delete(k);
  }
  return next;
}
