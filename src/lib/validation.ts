import { z } from "zod";
import { isLocalDate, isLocalTime } from "@/lib/dates";

export const idSchema = z.uuid();
export const localDate = z.string().refine(isLocalDate, "Enter a valid date");
export const localTime = z.string().refine(isLocalTime, "Enter a valid time");
export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color");
export const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

/** Optional trimmed text: blank → null. */
export const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

export const optDate = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isLocalDate(v), "Enter a valid date");

export const optTime = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isLocalTime(v), "Enter a valid time");

export const optId = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.uuid().safeParse(v).success, "Invalid reference");

export const tagsSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(20, "Max 20 tags")
  .default([])
  .transform((t) => [...new Set(t.map((x) => x.toLowerCase()))]);

export const optColor = z
  .string()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v), "Invalid color");

export function parseTags(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}
