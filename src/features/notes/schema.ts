import { z } from "zod";
import { optId, tagsSchema } from "@/lib/validation";

export const noteSaveSchema = z.object({
  title: z.string().trim().max(200, "Title is too long (max 200)"),
  body: z.string().max(200_000, "Note is too long (max 200,000 characters)"),
  tags: tagsSchema,
  project_id: optId,
  goal_id: optId,
  expected_version: z.number().int().min(1),
});
export type NoteSaveInput = z.input<typeof noteSaveSchema>;

export type NoteSaveResult =
  | { status: "saved"; version: number; updated_at: string }
  | { status: "conflict"; latest: { version: number; updated_at: string } }
  | { status: "missing" };
