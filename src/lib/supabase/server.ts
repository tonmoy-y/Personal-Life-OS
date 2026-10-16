import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/** Per-request Supabase client bound to the caller's session cookies (RLS applies as that user). */
export async function createClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookie writes are ignored — the proxy refreshes the session.
        }
      },
    },
  });
}
