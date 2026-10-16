import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/privacy", "/setup"];
const AUTH_ONLY_PAGES = ["/login", "/signup", "/forgot-password"];

const isPublic = (path: string) => path === "/" || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const env = getSupabaseEnv();

  if (!env) {
    // Keep the app buildable/inspectable without credentials, but never fake data.
    if (pathname === "/setup" || pathname === "/privacy") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
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
    return redirect;
  };

  if (!signedIn && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!signedIn && !isPublic(pathname)) {
    return redirectTo("/login", `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`);
  }
  if (signedIn && (pathname === "/" || AUTH_ONLY_PAGES.includes(pathname))) {
    return redirectTo("/dashboard");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
