import { z } from "zod";

export const uuid = z.string().uuid();

export const emailSchema = z.string().email().transform((s) => s.toLowerCase().trim());

export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const timeSchema = z
  .string()
  .transform((s) => s.trim().slice(0, 5))
  .pipe(z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:mm"));
