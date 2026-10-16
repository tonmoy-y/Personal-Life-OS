"use client";
import { useCallback, useSyncExternalStore } from "react";

const EVENT = "lifeos:storage";

/**
 * Hydration-safe localStorage string state: renders `fallback` on the server and first client pass,
 * then the stored value. Every access is guarded — storage can be blocked (private mode, site settings).
 */
export function useLocalStorage(key: string, fallback: string): [string, (value: string) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(EVENT, cb);
    return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVENT, cb); };
  }, []);
  const read = useCallback(() => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }, [key, fallback]);
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const set = useCallback((v: string) => {
    try { localStorage.setItem(key, v); } catch { /* storage unavailable: change is session-only */ }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);
  return [value, set];
}
