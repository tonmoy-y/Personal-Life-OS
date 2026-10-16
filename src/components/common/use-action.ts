"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action";

interface Options {
  success?: string;
  /** Re-fetch server components after success (default true). */
  refresh?: boolean;
  /** Suppress the error toast (caller renders field errors itself). */
  silent?: boolean;
}

/**
 * Runs a server action with pending state, toast feedback, network-failure handling and a router refresh.
 * Returns the ActionResult so callers can react (close dialogs, set field errors).
 */
export function useAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const exec = useCallback(
    async <T,>(fn: () => Promise<ActionResult<T>>, opts: Options = {}): Promise<ActionResult<T>> => {
      setPending(true);
      try {
        const res = await fn();
        if (res.ok) {
          if (opts.success) toast.success(opts.success);
          if (opts.refresh !== false) router.refresh();
        } else if (!opts.silent) {
          toast.error(res.error);
        }
        return res;
      } catch {
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        const error = offline
          ? "You appear to be offline. Your change was not saved — reconnect and try again."
          : "Couldn't reach the server. Your change was not saved.";
        toast.error(error);
        return { ok: false, error };
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return { exec, pending };
}
