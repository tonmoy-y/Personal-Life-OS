"use server";
import { run, type ActionResult } from "@/lib/action";
import { searchAll } from "./queries";
import type { SearchHit } from "./types";

export type { SearchHit } from "./types";

/** Quick results for the command palette: top 5 per kind. The full list lives on /search. */
export async function globalSearch(query: string): Promise<ActionResult<SearchHit[]>> {
  return run(async ({ supabase, profile }) => searchAll(supabase, async () => (await profile()).timezone, query, 5));
}
