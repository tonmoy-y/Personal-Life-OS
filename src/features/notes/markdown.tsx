"use client";
import { useMemo, useSyncExternalStore } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};
let hooked = false;

function sanitize(html: string): string {
  if (!hooked) {
    // Links from notes always open safely in a new tab.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ["style", "form", "input", "iframe", "object", "embed"], FORBID_ATTR: ["style"] });
}

/**
 * Renders untrusted Markdown. Output is always passed through DOMPurify, and rendering happens
 * only in the browser (nothing is rendered on the server), so no unsanitised HTML is ever emitted.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const html = useMemo(() => (isClient ? sanitize(marked.parse(source, { async: false, gfm: true, breaks: true }) as string) : ""), [isClient, source]);
  if (!source.trim()) return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  return (
    <div
      className={cn(
        "max-w-none text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-2xl [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-lg [&_hr]:my-4 [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_table]:w-full [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
      // Safe: sanitised by DOMPurify above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
