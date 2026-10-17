export type SearchKind = "task" | "note" | "project" | "goal" | "habit" | "event" | "transaction";

export interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string | null;
  href: string;
}

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  task: "Tasks", note: "Notes", project: "Projects", goal: "Goals", habit: "Habits", event: "Events", transaction: "Transactions",
};
export const SEARCH_KIND_ORDER: SearchKind[] = ["task", "note", "project", "goal", "habit", "event", "transaction"];
