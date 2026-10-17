import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/privacy", "/setup"];
const AUTH_ONLY_PAGES = ["/login", "/signup", "/forgot-password"];

const isPublic = (path: string) => path === "/" || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

const isProd = process.env.NODE_ENV === "production";

/**
 * Per-request CSP. Scripts need the request's nonce (Next.js attaches it to its own scripts while rendering),
 * so no script runs without it, which removes 'unsafe-inline' for scripts. Styles keep 'unsafe-inline'
 * (React style attributes and the appearance <style> tag), which cannot execute code.
 */
function buildCsp(nonce: string, supabaseUrl: string | undefined): string {
  let origin = "";
  let ws = "";
  try { origin = new URL(supabaseUrl ?? "").origin; ws = origin.replace(/^https:/, "wss:"); } catch { /* no Supabase URL yet (setup page) */ }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${origin} ${ws} https://cloudflareinsights.com${isProd ? "" : " ws://localhost:* http://localhost:*"}`.replace(/\s+/g, " ").trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const env = getSupabaseEnv();

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, env?.url);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const withCsp = <T extends NextResponse>(res: T): T => { res.headers.set("Content-Security-Policy", csp); return res; };

  if (!env) {
    // Keep the app buildable/inspectable without credentials, but never fake data.
    if (pathname === "/setup" || pathname === "/privacy") return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
    return withCsp(NextResponse.redirect(new URL("/setup", request.url)));
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Verifies the JWT and refreshes the session cookie when needed.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const redirectTo = (path: string, search?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = search ?? "";
    const redirect = NextResponse.redirect(url);
    // Preserve refreshed auth cookies on the redirect.
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return withCsp(redirect);
  };

  if (!signedIn && pathname.startsWith("/api/")) {
    return withCsp(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }
  if (!signedIn && !isPublic(pathname)) {
    return redirectTo("/login", `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`);
  }
  if (signedIn && AUTH_ONLY_PAGES.includes(pathname)) {
    return redirectTo("/dashboard");
  }
  return withCsp(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
